import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Competition, CompetitionClass } from '../types/database';
import { formatDateShort, normalizeUCIID } from '../lib/utils';

type Tab = 'import' | 'competitions' | 'classes';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('import');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch competitions
  const { data: competitions } = useQuery({
    queryKey: ['admin-competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Competition[];
    },
  });

  // Fetch competition classes
  const { data: classes } = useQuery({
    queryKey: ['competition-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_classes')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as CompetitionClass[];
    },
  });

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split('\n');
      const parsed = lines.map((line) => {
        // Support tab, comma, and semicolon delimiters
        return line.split(/[\t,;]/).map((cell) => cell.trim());
      });

      setCsvData(parsed);
      setImportStatus({
        type: 'info',
        message: `Filen laddad: ${parsed.length} rader (inkl. header)`,
      });
    };

    reader.readAsText(file);
  };

  // Import results
  const handleImport = async () => {
    if (!selectedCompetition || csvData.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'Välj en tävling och ladda upp en CSV-fil först',
      });
      return;
    }

    setImporting(true);
    setImportStatus({ type: 'info', message: 'Importerar resultat...' });

    try {
      const headers = csvData[0].map((h) => h.toLowerCase());
      const rows = csvData.slice(1);

      // Find column indices
      const getIndex = (names: string[]) => {
        for (const name of names) {
          const idx = headers.indexOf(name);
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const positionIdx = getIndex(['position', 'plac', 'placering', 'pos']);
      const firstNameIdx = getIndex(['first_name', 'firstname', 'förnamn', 'fornamn']);
      const lastNameIdx = getIndex(['last_name', 'lastname', 'efternamn']);
      const clubIdx = getIndex(['club', 'klubb', 'team']);
      const classIdx = getIndex(['class', 'klass', 'category', 'kategori']);
      const timeIdx = getIndex(['time', 'tid', 'total_time', 'totaltid']);
      const statusIdx = getIndex(['status']);
      const uciIdx = getIndex(['uci_id', 'uci', 'uciid', 'uci-id']);

      if (positionIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
        throw new Error('CSV måste innehålla kolumner för: position, förnamn, efternamn');
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[0]) continue;

        try {
          const firstName = row[firstNameIdx];
          const lastName = row[lastNameIdx];
          const club = clubIdx !== -1 ? row[clubIdx] : null;
          const className = classIdx !== -1 ? row[classIdx] : 'Open';
          let uciId = uciIdx !== -1 ? row[uciIdx] : null;

          // Normalize UCI ID
          if (uciId) {
            uciId = normalizeUCIID(uciId);
          }

          // Find or create cyclist
          let cyclist;
          if (uciId) {
            const { data: existing } = await supabase
              .from('cyclists')
              .select('*')
              .eq('uci_id', uciId)
              .single();

            cyclist = existing;
          }

          if (!cyclist) {
            const { data: newCyclist, error: cyclistError } = await supabase
              .from('cyclists')
              .insert({
                first_name: firstName,
                last_name: lastName,
                club: club,
                uci_id: uciId,
              })
              .select()
              .single();

            if (cyclistError) throw cyclistError;
            cyclist = newCyclist;
          }

          // Find or create class
          const { data: classData } = await supabase
            .from('competition_classes')
            .select('*')
            .eq('name', className)
            .single();

          let classId;
          if (classData) {
            classId = classData.id;
          } else {
            const { data: newClass, error: classError } = await supabase
              .from('competition_classes')
              .insert({ name: className })
              .select()
              .single();

            if (classError) throw classError;
            classId = newClass.id;
          }

          // Parse time (format: MM:SS.mmm or HH:MM:SS.mmm)
          let totalTime = null;
          if (timeIdx !== -1 && row[timeIdx]) {
            const timeStr = row[timeIdx];
            totalTime = timeStr; // Store as string, PostgreSQL will handle interval
          }

          // Parse status
          const status = statusIdx !== -1 && row[statusIdx] ? row[statusIdx] : 'FIN';

          // Insert result
          const { error: resultError } = await supabase.from('results').insert({
            competition_id: selectedCompetition,
            cyclist_id: cyclist.id,
            class_id: classId,
            position: parseInt(row[positionIdx]),
            total_time: totalTime,
            status: status,
          });

          if (resultError) throw resultError;

          successCount++;
        } catch (err: any) {
          errorCount++;
          errors.push(`Rad ${i + 2}: ${err.message}`);
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['results'] });

      setImportStatus({
        type: successCount > 0 ? 'success' : 'error',
        message: `Import klar! ${successCount} resultat importerade, ${errorCount} fel${
          errors.length > 0 ? `. Första felet: ${errors[0]}` : ''
        }`,
      });
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: `Importfel: ${err.message}`,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'import'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Importera Resultat
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'competitions'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Hantera Tävlingar
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'classes'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Klasser
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Importera Resultat från CSV
            </h2>

            {/* Competition selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Välj Tävling
              </label>
              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                className="input w-full"
              >
                <option value="">-- Välj en tävling --</option>
                {competitions?.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} - {formatDateShort(comp.date)}
                  </option>
                ))}
              </select>
            </div>

            {/* File upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ladda upp CSV-fil
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                Fil måste innehålla kolumner: position, förnamn, efternamn. Valfritt: klubb,
                klass, tid, status, uci_id
              </p>
            </div>

            {/* Preview */}
            {csvData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Förhandsvisning (första 5 raderna)
                </h3>
                <div className="table-container">
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        {csvData[0].map((header, idx) => (
                          <th key={idx}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(1, 6).map((row, idx) => (
                        <tr key={idx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Status message */}
            {importStatus && (
              <div
                className={`p-4 rounded mb-6 ${
                  importStatus.type === 'success'
                    ? 'bg-green-900/20 border border-green-700'
                    : importStatus.type === 'error'
                    ? 'bg-red-900/20 border border-red-700'
                    : 'bg-blue-900/20 border border-blue-700'
                }`}
              >
                <p
                  className={`text-sm ${
                    importStatus.type === 'success'
                      ? 'text-green-300'
                      : importStatus.type === 'error'
                      ? 'text-red-300'
                      : 'text-blue-300'
                  }`}
                >
                  {importStatus.message}
                </p>
              </div>
            )}

            {/* Import button */}
            <button
              onClick={handleImport}
              disabled={importing || !selectedCompetition || csvData.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importerar...' : 'Importera Resultat'}
            </button>
          </div>
        </div>
      )}

      {/* Competitions Tab */}
      {activeTab === 'competitions' && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Hantera Tävlingar</h2>
          <p className="text-gray-400">Funktionalitet för att skapa och redigera tävlingar kommer snart...</p>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Klasser</h2>
          {classes && classes.length > 0 ? (
            <div className="space-y-2">
              {classes.map((cls) => (
                <div key={cls.id} className="p-3 bg-dark-800 rounded">
                  <span className="text-white">{cls.name}</span>
                  {cls.description && (
                    <span className="text-gray-400 text-sm ml-2">- {cls.description}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Inga klasser hittades.</p>
          )}
        </div>
      )}
    </div>
  );
}
