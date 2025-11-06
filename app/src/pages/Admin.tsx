import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Competition, CompetitionClass, Series } from '../types/database';
import { formatDateShort, normalizeUCIID } from '../lib/utils';

type Tab = 'import' | 'competitions' | 'series' | 'cyclists' | 'classes';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('import');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Series management state
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesYear, setNewSeriesYear] = useState(new Date().getFullYear());
  const [newSeriesType, setNewSeriesType] = useState<'individual' | 'club'>('individual');
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [seriesCompetitions, setSeriesCompetitions] = useState<string[]>([]);

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

  // Fetch series
  const { data: series } = useQuery({
    queryKey: ['admin-series'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .order('year', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as Series[];
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

  // Handle CSV file selection for results
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

  // Handle cyclist CSV import
  const handleCyclistImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split('\n');
      const parsed = lines.map((line) => line.split(/[\t,;]/).map((cell) => cell.trim()));

      setImportStatus({ type: 'info', message: 'Importerar cyklister...' });

      try {
        const headers = parsed[0].map((h) => h.toLowerCase());
        const rows = parsed.slice(1);

        const getIndex = (names: string[]) => {
          for (const name of names) {
            const idx = headers.indexOf(name);
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const firstNameIdx = getIndex(['first_name', 'firstname', 'förnamn', 'fornamn']);
        const lastNameIdx = getIndex(['last_name', 'lastname', 'efternamn']);
        const uciIdx = getIndex(['uci_id', 'uci', 'uciid', 'uci-id']);
        const clubIdx = getIndex(['club', 'klubb', 'team']);
        const birthDateIdx = getIndex(['birth_date', 'birthdate', 'födelsedatum', 'fodelsedatum']);
        const genderIdx = getIndex(['gender', 'kön', 'kon', 'sex']);

        if (firstNameIdx === -1 || lastNameIdx === -1) {
          throw new Error('CSV måste innehålla: förnamn, efternamn');
        }

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || !row[0]) continue;

          try {
            let uciId = uciIdx !== -1 ? row[uciIdx] : null;
            if (uciId) uciId = normalizeUCIID(uciId);

            // Check if cyclist exists
            let existing = null;
            if (uciId) {
              const { data } = await supabase
                .from('cyclists')
                .select('*')
                .eq('uci_id', uciId)
                .single();
              existing = data;
            }

            if (!existing) {
              const { error } = await supabase.from('cyclists').insert({
                first_name: row[firstNameIdx],
                last_name: row[lastNameIdx],
                uci_id: uciId,
                club: clubIdx !== -1 ? row[clubIdx] : null,
                birth_date: birthDateIdx !== -1 ? row[birthDateIdx] : null,
                gender: genderIdx !== -1 ? row[genderIdx] : null,
              });

              if (error) throw error;
              successCount++;
            }
          } catch (err: any) {
            errorCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ['cyclists'] });
        setImportStatus({
          type: 'success',
          message: `${successCount} cyklister importerade, ${errorCount} hoppades över`,
        });
      } catch (err: any) {
        setImportStatus({ type: 'error', message: `Fel: ${err.message}` });
      }
    };

    reader.readAsText(file);
  };

  // Create series
  const handleCreateSeries = async () => {
    if (!newSeriesName) {
      setImportStatus({ type: 'error', message: 'Ange ett serienamn' });
      return;
    }

    try {
      const { error } = await supabase.from('series').insert({
        name: newSeriesName,
        year: newSeriesYear,
        type: newSeriesType,
        published: true,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setImportStatus({ type: 'success', message: 'Serie skapad!' });
      setNewSeriesName('');
    } catch (err: any) {
      setImportStatus({ type: 'error', message: `Fel: ${err.message}` });
    }
  };

  // Add competitions to series
  const handleAddCompetitionsToSeries = async () => {
    if (!selectedSeries || seriesCompetitions.length === 0) {
      setImportStatus({ type: 'error', message: 'Välj en serie och minst en tävling' });
      return;
    }

    try {
      // Insert series_competitions records
      const records = seriesCompetitions.map((compId) => ({
        series_id: selectedSeries,
        competition_id: compId,
      }));

      const { error } = await supabase.from('series_competitions').insert(records);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['series'] });
      setImportStatus({ type: 'success', message: 'Tävlingar tillagda till serien!' });
      setSeriesCompetitions([]);
    } catch (err: any) {
      setImportStatus({ type: 'error', message: `Fel: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'import'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Importera Resultat
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'series'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Hantera Serier
        </button>
        <button
          onClick={() => setActiveTab('cyclists')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'cyclists'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Importera Cyklister
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'competitions'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Tävlingar
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'classes'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Klasser
        </button>
      </div>

      {/* Status message (shown on all tabs) */}
      {importStatus && (
        <div
          className={`p-4 rounded ${
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

      {/* Import Results Tab */}
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

      {/* Series Management Tab */}
      {activeTab === 'series' && (
        <div className="space-y-6">
          {/* Create series */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Skapa ny serie</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serienamn
                </label>
                <input
                  type="text"
                  value={newSeriesName}
                  onChange={(e) => setNewSeriesName(e.target.value)}
                  className="input w-full"
                  placeholder="t.ex. Gravity Series 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">År</label>
                <input
                  type="number"
                  value={newSeriesYear}
                  onChange={(e) => setNewSeriesYear(parseInt(e.target.value))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Typ</label>
                <select
                  value={newSeriesType}
                  onChange={(e) => setNewSeriesType(e.target.value as 'individual' | 'club')}
                  className="input w-full"
                >
                  <option value="individual">Individuell</option>
                  <option value="club">Klubbtävling</option>
                </select>
              </div>
            </div>
            <button onClick={handleCreateSeries} className="btn-primary">
              Skapa Serie
            </button>
          </div>

          {/* Add competitions to series */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Lägg till tävlingar i serie
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Välj Serie
              </label>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="input w-full"
              >
                <option value="">-- Välj en serie --</option>
                {series?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.year})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Välj Tävlingar (håll Ctrl/Cmd för flera)
              </label>
              <select
                multiple
                value={seriesCompetitions}
                onChange={(e) =>
                  setSeriesCompetitions(
                    Array.from(e.target.selectedOptions, (option) => option.value)
                  )
                }
                className="input w-full h-64"
              >
                {competitions?.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} - {formatDateShort(comp.date)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {seriesCompetitions.length} tävling(ar) valda
              </p>
            </div>

            <button
              onClick={handleAddCompetitionsToSeries}
              disabled={!selectedSeries || seriesCompetitions.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              Lägg till i serie
            </button>
          </div>

          {/* List existing series */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Befintliga serier</h2>
            {series && series.length > 0 ? (
              <div className="space-y-2">
                {series.map((s) => (
                  <div key={s.id} className="p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{s.name}</h3>
                        <p className="text-sm text-gray-400">
                          {s.year} • {s.type === 'individual' ? 'Individuell' : 'Klubbtävling'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          s.published
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-gray-900/30 text-gray-400'
                        }`}
                      >
                        {s.published ? 'Publicerad' : 'Ej publicerad'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Inga serier hittades.</p>
            )}
          </div>
        </div>
      )}

      {/* Cyclists Import Tab */}
      {activeTab === 'cyclists' && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Importera Cyklister (Licensregister)
          </h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ladda upp CSV-fil med cyklister
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleCyclistImport}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              Fil måste innehålla: förnamn, efternamn. Valfritt: uci_id, klubb, födelsedatum,
              kön
            </p>
          </div>
        </div>
      )}

      {/* Competitions Tab */}
      {activeTab === 'competitions' && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tävlingar</h2>
          {competitions && competitions.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Namn</th>
                    <th>Datum</th>
                    <th>Format</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {competitions.map((comp) => (
                    <tr key={comp.id}>
                      <td className="text-white">{comp.name}</td>
                      <td className="text-gray-300">{formatDateShort(comp.date)}</td>
                      <td className="text-gray-300">{comp.competition_format}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            comp.published
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-gray-900/30 text-gray-400'
                          }`}
                        >
                          {comp.published ? 'Publicerad' : 'Ej publicerad'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">Inga tävlingar hittades.</p>
          )}
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
