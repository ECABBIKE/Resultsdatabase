import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Competition, CompetitionClass } from '../types/database';
import { formatDateShort, normalizeUCIID } from '../lib/utils';
import Button from '../components/Button';
import AdminScoringTemplates from '../components/admin/AdminScoringTemplates';
import AdminCompetitions from '../components/admin/AdminCompetitions';
import AdminSeries from '../components/admin/AdminSeries';
import ImportTemplates from '../components/admin/ImportTemplates';

type Tab = 'scoring' | 'competitions' | 'series' | 'import' | 'cyclists' | 'classes';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('scoring');
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

  // Handle CSV file selection for results
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split('\n');
      const parsed = lines.map((line) => {
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
      const bibIdx = getIndex(['bib_number', 'bib', 'startnummer']);
      const runNumberIdx = getIndex(['run_number', 'runnumber', 'åk']);
      const runTypeIdx = getIndex(['run_type', 'runtype']);

      // Find split/stage columns
      const splitIndices: number[] = [];
      const stageIndices: number[] = [];

      for (let i = 1; i <= 4; i++) {
        const splitIdx = getIndex([`split${i}`, `split_${i}`]);
        if (splitIdx !== -1) splitIndices.push(splitIdx);
      }

      for (let i = 1; i <= 15; i++) {
        const stageIdx = getIndex([`stage${i}`, `stage_${i}`, `sträcka${i}`]);
        if (stageIdx !== -1) stageIndices.push(stageIdx);
      }

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
          let club = clubIdx !== -1 ? row[clubIdx] : null;
          const className = classIdx !== -1 ? row[classIdx] : 'Open';
          let uciId = uciIdx !== -1 ? row[uciIdx] : null;

          if (uciId) {
            uciId = normalizeUCIID(uciId);
          }

          // Normalize club name
          if (club) {
            const { data: canonicalClub } = await supabase
              .rpc('get_canonical_club_name', { club_input: club });
            club = canonicalClub || club;
          }

          // Check for existing cyclist (improved duplicate detection)
          let cyclist = null;

          // 1. Try by UCI ID
          if (uciId) {
            const { data: existing } = await supabase
              .from('cyclists')
              .select('*')
              .eq('uci_id', uciId)
              .maybeSingle();

            cyclist = existing;
          }

          // 2. Try by name (case-insensitive)
          if (!cyclist) {
            const { data: existing } = await supabase
              .from('cyclists')
              .select('*')
              .ilike('first_name', firstName)
              .ilike('last_name', lastName)
              .maybeSingle();

            cyclist = existing;
          }

          // 3. Create new cyclist if not found
          if (!cyclist) {
            // Generate ID if no UCI ID
            let generatedId = null;
            let isGeneratedId = false;

            if (!uciId) {
              const { data: genId } = await supabase
                .rpc('generate_cyclist_id', { birth_year: null });
              generatedId = genId;
              isGeneratedId = true;
            }

            const { data: newCyclist, error: cyclistError } = await supabase
              .from('cyclists')
              .insert({
                first_name: firstName,
                last_name: lastName,
                club: club,
                uci_id: uciId,
                generated_id: generatedId,
                is_generated_id: isGeneratedId,
              })
              .select()
              .single();

            if (cyclistError) throw cyclistError;
            cyclist = newCyclist;
          }

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

          let totalTime = null;
          if (timeIdx !== -1 && row[timeIdx]) {
            const timeStr = row[timeIdx];
            totalTime = timeStr;
          }

          const status = statusIdx !== -1 && row[statusIdx] ? row[statusIdx] : 'FIN';

          // Parse bib number
          const bibNumber = bibIdx !== -1 && row[bibIdx] ? row[bibIdx] : null;

          // Parse run number and type
          const runNumber = runNumberIdx !== -1 && row[runNumberIdx] ? parseInt(row[runNumberIdx]) : 1;
          const runType = runTypeIdx !== -1 && row[runTypeIdx] ? row[runTypeIdx] : null;

          // Parse stage/split times
          const stageTimes: { stage: number; time: string }[] = [];

          // Check for splits (DH format)
          splitIndices.forEach((idx, i) => {
            if (row[idx] && row[idx].trim()) {
              stageTimes.push({ stage: i + 1, time: row[idx] });
            }
          });

          // Check for stages (Enduro format)
          stageIndices.forEach((idx, i) => {
            if (row[idx] && row[idx].trim()) {
              stageTimes.push({ stage: i + 1, time: row[idx] });
            }
          });

          const { error: resultError } = await supabase.from('results').insert({
            competition_id: selectedCompetition,
            cyclist_id: cyclist.id,
            class_id: classId,
            position: parseInt(row[positionIdx]),
            total_time: totalTime,
            status: status,
            bib_number: bibNumber,
            run_number: runNumber,
            run_type: runType,
            stage_times: stageTimes.length > 0 ? stageTimes : null,
          });

          if (resultError) throw resultError;

          successCount++;
        } catch (err: any) {
          errorCount++;
          errors.push(`Rad ${i + 2}: ${err.message}`);
        }
      }

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

  // Handle cyclist CSV import with auto-ID generation, duplicate detection, and club normalization
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
        let duplicateCount = 0;
        let clubCorrectionCount = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || !row[0]) continue;

          try {
            const firstName = row[firstNameIdx];
            const lastName = row[lastNameIdx];
            let uciId = uciIdx !== -1 ? row[uciIdx] : null;
            if (uciId) uciId = normalizeUCIID(uciId);

            const birthDate = birthDateIdx !== -1 ? row[birthDateIdx] : null;
            let clubName = clubIdx !== -1 ? row[clubIdx] : null;

            // Check for existing cyclist (duplicate detection)
            let existing = null;

            // 1. Check by UCI ID if provided
            if (uciId) {
              const { data } = await supabase
                .from('cyclists')
                .select('*')
                .eq('uci_id', uciId)
                .maybeSingle();
              existing = data;
            }

            // 2. Check by name + birth date to avoid duplicates
            if (!existing && birthDate) {
              const { data } = await supabase
                .from('cyclists')
                .select('*')
                .ilike('first_name', firstName)
                .ilike('last_name', lastName)
                .eq('birth_date', birthDate)
                .maybeSingle();

              if (data) {
                existing = data;
                duplicateCount++;
              }
            }

            // 3. Check by name only (fuzzy match)
            if (!existing) {
              const { data } = await supabase
                .from('cyclists')
                .select('*')
                .ilike('first_name', firstName)
                .ilike('last_name', lastName)
                .maybeSingle();

              if (data) {
                // Only consider it a duplicate if names match exactly
                if (data.first_name.toLowerCase() === firstName.toLowerCase() &&
                    data.last_name.toLowerCase() === lastName.toLowerCase()) {
                  existing = data;
                  duplicateCount++;
                }
              }
            }

            if (!existing) {
              // Normalize club name using database function
              if (clubName) {
                const { data: canonicalClub } = await supabase
                  .rpc('get_canonical_club_name', { club_input: clubName });

                if (canonicalClub && canonicalClub !== clubName) {
                  clubCorrectionCount++;
                }
                clubName = canonicalClub || clubName;
              }

              // Generate ID if no UCI ID provided
              let generatedId = null;
              let isGeneratedId = false;

              if (!uciId) {
                // Extract birth year from birth_date if available
                let birthYear = null;
                if (birthDate) {
                  const match = birthDate.match(/(\d{4})/);
                  if (match) birthYear = parseInt(match[1]);
                }

                const { data: genId } = await supabase
                  .rpc('generate_cyclist_id', { birth_year: birthYear });

                generatedId = genId;
                isGeneratedId = true;
              }

              const { error } = await supabase.from('cyclists').insert({
                first_name: firstName,
                last_name: lastName,
                uci_id: uciId,
                generated_id: generatedId,
                is_generated_id: isGeneratedId,
                club: clubName,
                birth_date: birthDate,
                gender: genderIdx !== -1 ? row[genderIdx] : null,
              });

              if (error) throw error;
              successCount++;
            }
          } catch (err: any) {
            console.error('Import error:', err);
            errorCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ['cyclists'] });

        let message = `${successCount} cyklister importerade`;
        if (duplicateCount > 0) message += `, ${duplicateCount} dubletter hoppades över`;
        if (clubCorrectionCount > 0) message += `, ${clubCorrectionCount} klubbnamn korrigerade`;
        if (errorCount > 0) message += `, ${errorCount} fel`;

        setImportStatus({
          type: 'success',
          message,
        });
      } catch (err: any) {
        setImportStatus({ type: 'error', message: `Fel: ${err.message}` });
      }
    };

    reader.readAsText(file);
  };

  const tabs = [
    { id: 'scoring' as Tab, label: 'Kvalpoängsmallar', icon: '🏆' },
    { id: 'competitions' as Tab, label: 'Tävlingar', icon: '🚴' },
    { id: 'series' as Tab, label: 'Serier', icon: '📊' },
    { id: 'import' as Tab, label: 'Importera Resultat', icon: '📥' },
    { id: 'cyclists' as Tab, label: 'Importera Cyklister', icon: '👥' },
    { id: 'classes' as Tab, label: 'Klasser', icon: '🏅' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-1">Hantera tävlingar, serier och poängmallar</p>
        </div>
      </div>

      {/* Tabs - Improved with icons and better styling */}
      <div className="flex gap-2 border-b border-dark-700 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 font-semibold transition-all duration-200 whitespace-nowrap rounded-t-lg flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-b from-primary-500/20 to-transparent text-primary-400 border-b-2 border-primary-500 translate-y-px'
                : 'text-gray-400 hover:text-gray-300 hover:bg-dark-700/50'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'scoring' && <AdminScoringTemplates />}

        {activeTab === 'competitions' && <AdminCompetitions />}

        {activeTab === 'series' && <AdminSeries />}

        {/* Import Results Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import Templates Section */}
            <ImportTemplates />

            {/* Import Form */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Importera Resultat från CSV
              </h2>

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
                  <strong>Obligatoriskt:</strong> position, förnamn, efternamn<br/>
                  <strong>Valfritt:</strong> klubb, klass, tid, status, uci_id, bib_number, run_number, run_type<br/>
                  <strong>DH Splits:</strong> split1, split2, split3, split4<br/>
                  <strong>Enduro Stages:</strong> stage1, stage2, ..., stage15<br/>
                  <a
                    href="https://github.com/ECABBIKE/Resultsdatabase/tree/main/import-templates"
                    target="_blank"
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    Se importmallar och dokumentation
                  </a>
                </p>
              </div>

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

              {importStatus && (
                <div
                  className={`p-4 rounded mb-6 ${
                    importStatus.type === 'success'
                      ? 'bg-green-900/20 border border-green-700'
                      : importStatus.type === 'error'
                      ? 'bg-red-900/20 border border-red-700'
                      : 'bg-dark-700 border border-dark-600'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      importStatus.type === 'success'
                        ? 'text-green-300'
                        : importStatus.type === 'error'
                        ? 'text-red-300'
                        : 'text-gray-300'
                    }`}
                  >
                    {importStatus.message}
                  </p>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={importing || !selectedCompetition || csvData.length === 0}
                icon={<span>📥</span>}
              >
                {importing ? 'Importerar...' : 'Importera Resultat'}
              </Button>
            </div>
          </div>
        )}

        {/* Cyclists Import Tab */}
        {activeTab === 'cyclists' && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
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
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <p><strong>Obligatoriska fält:</strong> förnamn, efternamn</p>
                <p><strong>Valfritt:</strong> uci_id, klubb, födelsedatum, kön</p>
                <div className="mt-3 p-3 bg-dark-700 rounded border border-dark-600">
                  <p className="text-accent-400 font-medium mb-1">✨ Automatiska funktioner:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400">
                    <li><strong>Auto-ID:</strong> Genererar unikt ID (GEN-format) för cyklister utan UCI ID</li>
                    <li><strong>Dubblettskydd:</strong> Detekterar automatiskt om cyklisten redan finns baserat på namn och födelsedatum</li>
                    <li><strong>Klubbnormalisering:</strong> Korrigerar automatiskt felstavningar av klubbnamn mot licensregistret</li>
                  </ul>
                </div>
              </div>
            </div>

            {importStatus && (
              <div
                className={`p-4 rounded ${
                  importStatus.type === 'success'
                    ? 'bg-green-900/20 border border-green-700'
                    : importStatus.type === 'error'
                    ? 'bg-red-900/20 border border-red-700'
                    : 'bg-dark-700 border border-dark-600'
                }`}
              >
                <p
                  className={`text-sm ${
                    importStatus.type === 'success'
                      ? 'text-green-300'
                      : importStatus.type === 'error'
                      ? 'text-red-300'
                      : 'text-gray-300'
                  }`}
                >
                  {importStatus.message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Klasser</h2>
            {classes && classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="p-4 bg-dark-700 rounded-lg border border-dark-600">
                    <span className="text-white font-medium">{cls.name}</span>
                    {cls.description && (
                      <p className="text-gray-400 text-sm mt-1">{cls.description}</p>
                    )}
                    {(cls.gender || cls.age_group) && (
                      <div className="flex gap-2 mt-2">
                        {cls.gender && (
                          <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded">
                            {cls.gender}
                          </span>
                        )}
                        {cls.age_group && (
                          <span className="px-2 py-1 bg-accent-400/20 text-accent-300 text-xs rounded">
                            {cls.age_group}
                          </span>
                        )}
                      </div>
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
    </div>
  );
}
