import React, { useState, useMemo, useCallback } from 'react';
import { Upload, Download, Calculator, Settings, Users, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';

const POINT_SYSTEMS = {
  ENDURO: [500,450,425,400,380,360,340,320,300,280,260,240,220,200,190,180,170,160,150,140,135,130,125,120,115,110,105,100,95,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1],
  'DH Kval': [100,80,60,55,50,45,40,35,30,20,18,16,14,12,10,9,8,7,6,5,4,3,2,1],
  'DH RACE': [420,370,365,345,330,315,300,285,270,260,242,224,206,188,180,171,162,153,144,135,131,127,123,119,115,110,105,100,95,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1],
  Others: [250,225,212,200,190,180,170,160,150,140,130,120,110,100,95,90,85,80,75,70,68,65,62,60,57,55,52,50,47,45,42,40,37,35,32,30,27,25,22,20,17,15,12,10,9,8,7,6,5,4,3,2,1]
};

export default function App() {
  const [riders, setRiders] = useState({});
  const [results, setResults] = useState([]);
  const [events, setEvents] = useState({});
  const [serieSettings, setSerieSettings] = useState({});
  const [invalidResults, setInvalidResults] = useState(new Set());
  const [activeTab, setActiveTab] = useState('results');
  const [selectedSerie, setSelectedSerie] = useState('all');
  const [selectedKlass, setSelectedKlass] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [editingResult, setEditingResult] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [nextId, setNextId] = useState(1000);
  const [sortField, setSortField] = useState('serie');
  const [sortDirection, setSortDirection] = useState('asc');

  // CSV Import
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = event.target.result.trim().split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
      const newRiders = { ...riders };
      const newResults = [...results];
      const newEvents = { ...events };
      let localNextId = nextId;

      lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const values = line.split(/[,;]/).map(v => v.trim());

        const fornamn = values[headers.indexOf('förnamn')] || values[headers.indexOf('firstname')] || '';
        const efternamn = values[headers.indexOf('efternamn')] || values[headers.indexOf('lastname')] || '';
        const serie = values[headers.indexOf('serie')] || values[headers.indexOf('series')] || '';
        const klass = values[headers.indexOf('klass')] || values[headers.indexOf('class')] || '';
        const deltavling = values[headers.indexOf('deltävling')] || values[headers.indexOf('deltavling')] || '';
        const placering = parseInt(values[headers.indexOf('placering')] || values[headers.indexOf('position')] || '0');
        const klubb = values[headers.indexOf('klubb')] || values[headers.indexOf('förening')] || values[headers.indexOf('club')] || '';
        const pointSystem = values[headers.indexOf('poängsystem')] || values[headers.indexOf('poang')] || 'ENDURO';
        let uciId = values[headers.indexOf('uci-id')] || values[headers.indexOf('uci')] || '';

        if (!fornamn || !efternamn || !placering || !serie || !klass || !deltavling) return;

        // Find or create rider
        let riderId = null;
        if (uciId && !uciId.startsWith('TEMP')) {
          const existing = Object.entries(newRiders).find(([, r]) => r.uciId === uciId);
          if (existing) {
            riderId = existing[0];
          } else {
            riderId = uciId;
            newRiders[riderId] = { fornamn, efternamn, klubb, uciId };
          }
        } else {
          const existing = Object.entries(newRiders).find(([, r]) =>
            r.fornamn.toLowerCase() === fornamn.toLowerCase() &&
            r.efternamn.toLowerCase() === efternamn.toLowerCase() &&
            r.klubb.toLowerCase() === klubb.toLowerCase()
          );
          if (existing) {
            riderId = existing[0];
          } else {
            riderId = `TEMP${localNextId++}`;
            newRiders[riderId] = { fornamn, efternamn, klubb, uciId: riderId };
          }
        }

        // Add event
        const eventKey = `${serie}|||${deltavling}`;
        if (!newEvents[eventKey]) {
          newEvents[eventKey] = { serie, deltavling, pointSystem, classes: [] };
        }
        if (!newEvents[eventKey].classes.includes(klass)) {
          newEvents[eventKey].classes.push(klass);
        }

        // Add result
        newResults.push({ riderId, fornamn, efternamn, klubb, serie, klass, deltavling, placering });
      });

      setRiders(newRiders);
      setResults(newResults);
      setEvents(newEvents);
      setNextId(localNextId);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Calculate points
  const getPoints = (position, pointSystem) => {
    const points = POINT_SYSTEMS[pointSystem] || POINT_SYSTEMS.ENDURO;
    return points[position - 1] || 1;
  };

  // Get standings (memoized)
  const getStandings = useCallback(() => {
    // Filter out invalid results FIRST
    const validResults = results.filter((_, idx) => !invalidResults.has(idx));
    let filtered = validResults;

    if (selectedSerie !== 'all') filtered = filtered.filter(r => r.serie === selectedSerie);
    if (selectedKlass !== 'all') filtered = filtered.filter(r => r.klass === selectedKlass);

    const standings = {};
    filtered.forEach(result => {
      const eventKey = `${result.serie}|||${result.deltavling}`;
      const event = events[eventKey];
      if (!event) return;

      const points = getPoints(result.placering, event.pointSystem);
      if (!standings[result.riderId]) {
        standings[result.riderId] = {
          ...result,
          total: 0,
          allPoints: [],
          eventResults: {}
        };
      }
      standings[result.riderId].allPoints.push(points);
      standings[result.riderId].eventResults[result.deltavling] = { placering: result.placering, points };
    });

    // Apply count best setting
    Object.values(standings).forEach(rider => {
      const countBest = serieSettings[rider.serie]?.countBest || 0;
      if (countBest > 0 && rider.allPoints.length > countBest) {
        rider.total = rider.allPoints.sort((a, b) => b - a).slice(0, countBest).reduce((a, b) => a + b, 0);
      } else {
        rider.total = rider.allPoints.reduce((a, b) => a + b, 0);
      }
    });

    return Object.values(standings).sort((a, b) => b.total - a.total);
  }, [results, invalidResults, selectedSerie, selectedKlass, events, serieSettings]);

  // Find duplicates (optimized to O(n) using Map)
  const findDuplicates = useCallback(() => {
    const nameMap = new Map();

    // Group riders by name (O(n))
    Object.entries(riders).forEach(([id, rider]) => {
      const key = `${rider.fornamn.toLowerCase()}|||${rider.efternamn.toLowerCase()}`;
      if (!nameMap.has(key)) {
        nameMap.set(key, []);
      }
      nameMap.get(key).push({ id, rider });
    });

    // Filter out groups with only one rider
    const groups = [];
    nameMap.forEach((group) => {
      if (group.length > 1) {
        groups.push(group);
      }
    });

    return groups;
  }, [riders]);

  const showDuplicateDialog = () => {
    const groups = findDuplicates();
    setDuplicateGroups(groups);
    setShowDuplicates(true);
  };

  const mergeGroup = (group) => {
    const keepId = group.find(item => !item.id.startsWith('TEMP'))?.id || group[0].id;
    const removeIds = group.filter(item => item.id !== keepId).map(item => item.id);

    const newRiders = { ...riders };
    removeIds.forEach(id => delete newRiders[id]);

    const newResults = results.map(r =>
      removeIds.includes(r.riderId) ? { ...r, riderId: keepId } : r
    );

    setRiders(newRiders);
    setResults(newResults);
    setDuplicateGroups(duplicateGroups.filter(g => g !== group));
  };

  // Save/Load
  const saveData = () => {
    const data = {
      riders,
      results,
      events,
      serieSettings,
      invalidResults: Array.from(invalidResults)
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kvalpoang_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = JSON.parse(event.target.result);
      setRiders(data.riders || {});
      setResults(data.results || []);
      setEvents(data.events || {});
      setSerieSettings(data.serieSettings || {});
      setInvalidResults(new Set(data.invalidResults || []));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Sort results
  const sortResults = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedResults = useCallback(() => {
    return [...results].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'placering') {
        valA = parseInt(valA);
        valB = parseInt(valB);
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [results, sortField, sortDirection]);

  // Save edited result
  const saveEditedResult = (index) => {
    const fornamn = document.getElementById(`edit-fornamn-${index}`)?.value;
    const efternamn = document.getElementById(`edit-efternamn-${index}`)?.value;
    const klubb = document.getElementById(`edit-klubb-${index}`)?.value;
    const klass = document.getElementById(`edit-klass-${index}`)?.value;
    const placering = parseInt(document.getElementById(`edit-placering-${index}`)?.value);

    if (!fornamn || !efternamn || !klass || !placering) {
      alert('Fyll i alla fält');
      return;
    }

    const newResults = [...results];
    newResults[index] = {
      ...newResults[index],
      fornamn,
      efternamn,
      klubb,
      klass,
      placering
    };

    setResults(newResults);
    setEditingResult(null);
  };

  // Memoized calculations to prevent unnecessary re-renders
  const standings = useMemo(() => getStandings(), [getStandings]);

  const series = useMemo(() => [...new Set(results.map(r => r.serie))], [results]);

  const klasses = useMemo(() =>
    selectedSerie === 'all' ? [] : [...new Set(results.filter(r => r.serie === selectedSerie).map(r => r.klass))],
    [results, selectedSerie]
  );

  const eventList = useMemo(() =>
    selectedSerie === 'all' ? [] : [...new Set(results.filter(r => r.serie === selectedSerie && (selectedKlass === 'all' || r.klass === selectedKlass)).map(r => r.deltavling))].sort((a, b) => {
      const numA = parseInt(a.match(/#?(\d+)/)?.[1] || '999');
      const numB = parseInt(b.match(/#?(\d+)/)?.[1] || '999');
      return numA - numB;
    }),
    [results, selectedSerie, selectedKlass]
  );

  const sortedResults = useMemo(() => getSortedResults(), [getSortedResults]);

  return (
    <div className="min-h-screen bg-gs-light p-4">
      {/* Duplicates Dialog */}
      {showDuplicates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Dubbletter funna</h3>
            {duplicateGroups.length === 0 ? (
              <p className="text-gs-success">Inga dubbletter!</p>
            ) : (
              duplicateGroups.map((group, idx) => (
                <div key={idx} className="mb-4 p-4 bg-gs-warning-light border border-gs-warning rounded-gs-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Grupp {idx + 1} ({group.length} st)</h4>
                    <button onClick={() => mergeGroup(group)} className="px-3 py-1 bg-gs-primary text-white rounded-gs-lg text-sm hover:opacity-90 transition-gs-fast">
                      Slå ihop
                    </button>
                  </div>
                  {group.map(({ id, rider }) => (
                    <div key={id} className="text-sm ml-4">
                      • {rider.fornamn} {rider.efternamn} - {rider.klubb} ({id})
                    </div>
                  ))}
                </div>
              ))
            )}
            <button onClick={() => setShowDuplicates(false)} className="mt-4 px-4 py-2 bg-gray-400 text-white rounded-gs-lg hover:bg-gray-500 transition-gs-fast">
              Stäng
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-gs-xl p-6 max-w-md w-full shadow-gs-2xl">
            <h3 className="text-xl font-bold mb-4 text-red-600">Radera resultat?</h3>
            <p className="mb-4 text-gs-dark">{deleteConfirm.fornamn} {deleteConfirm.efternamn} - {deleteConfirm.deltavling}</p>
            <div className="flex gap-2">
              <button onClick={() => {
                setResults(results.filter((_, i) => i !== deleteConfirm.index));
                setDeleteConfirm(null);
              }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-gs-lg hover:bg-red-700 transition-gs-fast">
                Radera
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-gs-lg hover:bg-gray-500 transition-gs-fast">
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-gs-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-gs-2xl">
            <h3 className="text-xl font-bold mb-4 text-gs-primary">Poängsystem per event</h3>
            {Object.entries(events).map(([key, event]) => (
              <div key={key} className="mb-4 p-4 bg-gs-light rounded-gs-lg border border-gs-border flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gs-dark">{event.serie} - {event.deltavling}</div>
                  <div className="text-sm text-gs-gray">{event.classes.join(', ')}</div>
                </div>
                <select value={event.pointSystem} onChange={(e) => {
                  setEvents({ ...events, [key]: { ...event, pointSystem: e.target.value }});
                }} className="px-3 py-2 border border-gs-border rounded-gs-md focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast">
                  <option value="ENDURO">ENDURO</option>
                  <option value="DH Kval">DH Kval</option>
                  <option value="DH RACE">DH RACE</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            ))}
            <button onClick={() => setShowSettings(false)} className="mt-4 px-4 py-2 bg-gs-primary text-white rounded-gs-lg hover:opacity-90 transition-gs-fast shadow-gs-md">
              Stäng
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-gs-2xl shadow-gs-2xl p-6">
          <h1 className="text-3xl font-bold mb-6 text-gs-primary">Kvalpoäng Kalkylator</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gs-border overflow-x-auto">
            {['results', 'overview', 'manage', 'riders'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 whitespace-nowrap font-semibold transition-gs-fast ${activeTab === tab ? 'text-gs-primary border-b-2 border-gs-primary' : 'text-gs-gray hover:text-gs-primary'}`}>
                {tab === 'results' && 'Poängställning'}
                {tab === 'overview' && 'Översikt'}
                {tab === 'manage' && 'Hantera'}
                {tab === 'riders' && `Deltagare (${Object.keys(riders).length})`}
              </button>
            ))}
          </div>

          {/* Results Tab */}
          {activeTab === 'results' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <label className="px-4 py-2 bg-gs-primary text-white rounded-gs-lg text-center cursor-pointer text-sm font-semibold hover:opacity-90 transition-gs-fast shadow-gs-md">
                  Import CSV
                  <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                </label>
                <button onClick={() => setShowSettings(true)} className="px-4 py-2 bg-gs-gray text-white rounded-gs-lg text-sm font-semibold hover:opacity-90 transition-gs-fast shadow-gs-md">Poängsystem</button>
                <button onClick={saveData} className="px-4 py-2 bg-gs-success text-white rounded-gs-lg text-sm font-semibold hover:opacity-90 transition-gs-fast shadow-gs-md">Spara</button>
                <label className="px-4 py-2 bg-gs-accent text-white rounded-gs-lg text-center cursor-pointer text-sm font-semibold hover:opacity-90 transition-gs-fast shadow-gs-md">
                  Ladda
                  <input type="file" accept=".json" onChange={loadData} className="hidden" />
                </label>
              </div>

              {results.length === 0 ? (
                <div className="bg-gs-primary-light p-6 rounded-gs-lg border border-gs-primary">
                  <p className="text-gs-primary font-medium">Importera CSV för att komma igång!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <select value={selectedSerie} onChange={(e) => { setSelectedSerie(e.target.value); setSelectedKlass('all'); }} className="px-4 py-2 border border-gs-border rounded-gs-lg focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast">
                      <option value="all">Alla serier</option>
                      {series.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={selectedKlass} onChange={(e) => setSelectedKlass(e.target.value)} disabled={selectedSerie === 'all'} className="px-4 py-2 border border-gs-border rounded-gs-lg focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="all">Alla klasser</option>
                      {klasses.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  <div className="overflow-x-auto rounded-gs-lg border border-gs-border">
                    <table className="w-full border-collapse">
                      <thead className="bg-gradient-to-r from-gs-primary to-gs-success text-white">
                        <tr>
                          <th className="p-3 text-left font-semibold">Plac</th>
                          <th className="p-3 text-left font-semibold">Namn</th>
                          {selectedKlass === 'all' && selectedSerie !== 'all' && <th className="p-3 text-left font-semibold">Klass</th>}
                          <th className="p-3 text-left font-semibold">Klubb</th>
                          {eventList.map(e => <th key={e} className="p-3 text-center text-xs font-semibold">{e}</th>)}
                          <th className="p-3 text-center font-bold bg-gs-primary-dark">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((r, i) => (
                          <tr key={i} className={`border-b border-gs-border hover:bg-gs-light transition-gs-fast ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="p-3 font-bold text-gs-primary">{i + 1}</td>
                            <td className="p-3 font-medium text-gs-dark">{r.fornamn} {r.efternamn}</td>
                            {selectedKlass === 'all' && selectedSerie !== 'all' && <td className="p-3 text-sm"><span className="px-2 py-1 bg-gs-primary-light text-gs-primary rounded-full font-medium">{r.klass}</span></td>}
                            <td className="p-3 text-sm text-gs-gray">{r.klubb}</td>
                            {eventList.map(e => (
                              <td key={e} className="p-3 text-center text-xs">
                                {r.eventResults[e] ? <><div className="font-bold text-gs-primary">{r.eventResults[e].points}p</div><div className="text-gs-gray">({r.eventResults[e].placering})</div></> : <span className="text-gray-300">-</span>}
                              </td>
                            ))}
                            <td className="p-3 text-center font-bold text-gs-primary bg-gs-primary-light">{r.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {series.map(serie => {
                const serieEvents = Object.values(events).filter(e => e.serie === serie);
                const serieResults = results.filter(r => r.serie === serie);
                return (
                  <div key={serie} className="mb-6 p-6 border border-gs-border rounded-gs-xl bg-white shadow-gs-lg hover:shadow-gs-xl transition-gs-base">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gs-primary">{serie}</h3>
                      <div>
                        <label className="block text-sm mb-1 font-semibold text-gs-gray">Räkna bästa:</label>
                        <input type="number" min="0" value={serieSettings[serie]?.countBest || 0} onChange={(e) => setSerieSettings({ ...serieSettings, [serie]: { countBest: parseInt(e.target.value) || 0 }})} className="w-24 px-3 py-2 border border-gs-border rounded-gs-lg focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast" placeholder="0=alla" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-gs-primary-light rounded-gs-lg border border-gs-primary"><div className="text-2xl font-bold text-gs-primary">{serieEvents.length}</div><div className="text-sm text-gs-gray font-medium">Events</div></div>
                      <div className="p-4 bg-gs-success-light rounded-gs-lg border border-gs-success"><div className="text-2xl font-bold text-gs-success">{new Set(serieResults.map(r => r.riderId)).size}</div><div className="text-sm text-gs-gray font-medium">Deltagare</div></div>
                      <div className="p-4 bg-gs-accent-light rounded-gs-lg border border-gs-accent"><div className="text-2xl font-bold text-gs-accent">{new Set(serieResults.map(r => r.klass)).size}</div><div className="text-sm text-gs-gray font-medium">Klasser</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gs-gray font-medium">
                  Visar {results.length} resultat ({invalidResults.size} markerade som ogiltiga)
                </p>
                <div className="text-xs text-gs-gray">
                  Klicka på kolumnrubriker för att sortera
                </div>
              </div>
              <div className="overflow-x-auto rounded-gs-lg border border-gs-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gradient-to-r from-gs-primary to-gs-success text-white">
                    <tr>
                      <th className="p-3 cursor-pointer hover:bg-gs-primary-dark transition-gs-fast" onClick={() => sortResults('serie')}>
                        <div className="font-semibold">Serie {sortField === 'serie' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-gs-primary-dark transition-gs-fast" onClick={() => sortResults('klass')}>
                        <div className="font-semibold">Klass {sortField === 'klass' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-gs-primary-dark transition-gs-fast" onClick={() => sortResults('deltavling')}>
                        <div className="font-semibold">Event {sortField === 'deltavling' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-gs-primary-dark transition-gs-fast" onClick={() => sortResults('fornamn')}>
                        <div className="font-semibold">Förnamn {sortField === 'fornamn' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-gs-primary-dark transition-gs-fast" onClick={() => sortResults('efternamn')}>
                        <div className="font-semibold">Efternamn {sortField === 'efternamn' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-gs-primary-dark transition-gs-fast" onClick={() => sortResults('klubb')}>
                        <div className="font-semibold">Klubb {sortField === 'klubb' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="p-3 cursor-pointer hover:bg-gs-primary-dark transition-gs-fast" onClick={() => sortResults('placering')}>
                        <div className="font-semibold">Plac {sortField === 'placering' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Åtgärd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((r, i) => {
                      const originalIndex = results.indexOf(r);
                      const isEditing = editingResult === originalIndex;
                      const isInvalid = invalidResults.has(originalIndex);

                      if (isEditing) {
                        return (
                          <tr key={originalIndex} className="bg-gs-warning-light border-l-4 border-gs-warning">
                            <td className="p-3 text-gs-dark">{r.serie}</td>
                            <td className="p-3">
                              <input id={`edit-klass-${originalIndex}`} type="text" defaultValue={r.klass} className="w-full px-2 py-1 border border-gs-border rounded-gs-md focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast text-sm" />
                            </td>
                            <td className="p-3 text-gs-dark">{r.deltavling}</td>
                            <td className="p-3">
                              <input id={`edit-fornamn-${originalIndex}`} type="text" defaultValue={r.fornamn} className="w-full px-2 py-1 border border-gs-border rounded-gs-md focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast text-sm" />
                            </td>
                            <td className="p-3">
                              <input id={`edit-efternamn-${originalIndex}`} type="text" defaultValue={r.efternamn} className="w-full px-2 py-1 border border-gs-border rounded-gs-md focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast text-sm" />
                            </td>
                            <td className="p-3">
                              <input id={`edit-klubb-${originalIndex}`} type="text" defaultValue={r.klubb} className="w-full px-2 py-1 border border-gs-border rounded-gs-md focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast text-sm" />
                            </td>
                            <td className="p-3">
                              <input id={`edit-placering-${originalIndex}`} type="number" defaultValue={r.placering} className="w-20 px-2 py-1 border border-gs-border rounded-gs-md focus:border-gs-primary focus:ring-2 focus:ring-gs-primary-light transition-gs-fast text-sm" />
                            </td>
                            <td className="p-3"></td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <button onClick={() => saveEditedResult(originalIndex)} className="p-1.5 bg-gs-success text-white rounded-gs-md hover:opacity-90 transition-gs-fast" title="Spara">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => setEditingResult(null)} className="p-1.5 bg-gray-400 text-white rounded-gs-md hover:bg-gray-500 transition-gs-fast" title="Avbryt">
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={originalIndex} className={`border-b border-gs-border hover:bg-gs-light transition-gs-fast ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isInvalid ? 'opacity-50 bg-red-50' : ''}`}>
                          <td className="p-3 text-gs-dark">{r.serie}</td>
                          <td className="p-3 text-gs-dark">{r.klass}</td>
                          <td className="p-3 text-gs-dark">{r.deltavling}</td>
                          <td className="p-3 text-gs-dark">{r.fornamn}</td>
                          <td className="p-3 text-gs-dark">{r.efternamn}</td>
                          <td className="p-3 text-gs-gray">{r.klubb}</td>
                          <td className="p-3 text-center font-bold text-gs-primary">{r.placering}</td>
                          <td className="p-3 text-center">
                            {isInvalid && <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full">OGILTIG</span>}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <button onClick={() => setEditingResult(originalIndex)} className="p-1.5 bg-gs-primary text-white rounded-gs-md hover:opacity-90 transition-gs-fast" title="Editera">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => {
                                const newInvalid = new Set(invalidResults);
                                if (newInvalid.has(originalIndex)) newInvalid.delete(originalIndex); else newInvalid.add(originalIndex);
                                setInvalidResults(newInvalid);
                              }} className={`p-1.5 text-xs rounded-gs-md transition-gs-fast ${isInvalid ? 'bg-gs-success text-white hover:opacity-90' : 'bg-gs-warning text-gs-dark hover:opacity-90'}`} title={isInvalid ? 'Markera giltig' : 'Markera ogiltig'}>
                                <AlertCircle size={12} />
                              </button>
                              <button onClick={() => setDeleteConfirm({ ...r, index: originalIndex })} className="p-1.5 bg-red-600 text-white text-xs rounded-gs-md hover:bg-red-700 transition-gs-fast" title="Radera">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Riders Tab */}
          {activeTab === 'riders' && (
            <div>
              <button onClick={showDuplicateDialog} className="mb-4 px-4 py-2 bg-gs-accent text-white rounded-gs-lg font-semibold hover:opacity-90 transition-gs-fast shadow-gs-md">
                Visa dubbletter
              </button>
              <div className="overflow-x-auto rounded-gs-lg border border-gs-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gradient-to-r from-gs-primary to-gs-success text-white">
                    <tr>
                      <th className="p-3 text-left font-semibold">ID</th>
                      <th className="p-3 text-left font-semibold">Namn</th>
                      <th className="p-3 text-left font-semibold">Klubb</th>
                      <th className="p-3 text-center font-semibold">Resultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(riders).map(([id, r], i) => (
                      <tr key={id} className={`border-b border-gs-border hover:bg-gs-light transition-gs-fast ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="p-3 font-mono text-xs text-gs-gray">{id}{id.startsWith('TEMP') && <span className="text-gs-warning font-bold"> (Temp)</span>}</td>
                        <td className="p-3 font-medium text-gs-dark">{r.fornamn} {r.efternamn}</td>
                        <td className="p-3 text-gs-gray">{r.klubb}</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-gs-primary-light text-gs-primary font-bold rounded-full">
                            {results.filter(res => res.riderId === id).length}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
