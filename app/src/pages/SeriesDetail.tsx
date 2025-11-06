import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Series, SeriesStanding, ClubSeriesStanding } from '../types/database';
import { formatPoints, getOrdinalSuffix } from '../lib/utils';
import { useState } from 'react';

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Fetch series details
  const { data: series, isLoading: loadingSeries, error: seriesError } = useQuery({
    queryKey: ['series-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Series;
    },
    enabled: !!id,
  });

  // Fetch standings (for individual series)
  const { data: standings, isLoading: loadingStandings } = useQuery({
    queryKey: ['series-standings', id, selectedClass],
    queryFn: async () => {
      let query = supabase
        .from('series_standings')
        .select('*')
        .eq('series_id', id)
        .order('total_points', { ascending: false });

      if (selectedClass !== 'all') {
        query = query.eq('class_name', selectedClass);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SeriesStanding[];
    },
    enabled: !!id && series?.type === 'individual',
  });

  // Fetch club standings (for club series)
  const { data: clubStandings, isLoading: loadingClubStandings } = useQuery({
    queryKey: ['club-series-standings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_series_standings')
        .select('*')
        .eq('series_id', id)
        .order('total_points', { ascending: false });

      if (error) throw error;
      return data as ClubSeriesStanding[];
    },
    enabled: !!id && series?.type === 'club',
  });

  // Fetch competitions in series
  const { data: competitions } = useQuery({
    queryKey: ['series-competitions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('series_competitions')
        .select('*, competition:competitions(*)')
        .eq('series_id', id)
        .order('competition(date)', { ascending: true });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  // Get unique classes for filter
  const uniqueClasses = standings
    ? Array.from(new Set(standings.map((s) => s.class_name))).sort()
    : [];

  if (loadingSeries) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-gray-400 mt-4">Laddar serie...</p>
      </div>
    );
  }

  if (seriesError || !series) {
    return (
      <div className="card p-6 border-red-700 bg-red-900/20">
        <h3 className="text-lg font-semibold text-red-400 mb-2">
          Kunde inte ladda serie
        </h3>
        <p className="text-sm text-red-300">
          {seriesError?.message || 'Serien hittades inte'}
        </p>
        <Link to="/series" className="btn-primary inline-block mt-4">
          ← Tillbaka till serier
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/series"
        className="inline-flex items-center text-primary-400 hover:text-primary-300"
      >
        ← Tillbaka till serier
      </Link>

      {/* Series header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {series.name}
            </h1>
            {series.description && (
              <p className="text-gray-400">{series.description}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            series.type === 'individual'
              ? 'bg-blue-900 text-blue-300'
              : 'bg-purple-900 text-purple-300'
          }`}>
            {series.type === 'individual' ? 'Individuell' : 'Klubb'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">År:</span>
            <span className="text-white ml-2">{series.year}</span>
          </div>

          {series.count_best_results && (
            <div>
              <span className="text-gray-400">Räknas bästa:</span>
              <span className="text-white ml-2">{series.count_best_results} resultat</span>
            </div>
          )}

          {series.type === 'club' && series.club_top_riders_per_class && (
            <div>
              <span className="text-gray-400">Per klass:</span>
              <span className="text-white ml-2">{series.club_top_riders_per_class} åkare</span>
            </div>
          )}

          <div>
            <span className="text-gray-400">Tävlingar:</span>
            <span className="text-white ml-2">{competitions?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Competitions in series */}
      {competitions && competitions.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tävlingar i serien</h2>
          <div className="space-y-2">
            {competitions.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between p-3 bg-dark-800 rounded">
                <Link
                  to={`/competitions/${comp.competition.id}`}
                  className="text-white hover:text-primary-400 transition-colors"
                >
                  {comp.competition.name}
                </Link>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {comp.point_multiplier !== 1 && (
                    <span>Multiplikator: {comp.point_multiplier}x</span>
                  )}
                  {comp.weight !== 1 && (
                    <span>Vikt: {comp.weight}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual standings */}
      {series.type === 'individual' && (
        <>
          {/* Class filter */}
          {uniqueClasses.length > 1 && (
            <div className="card p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filtrera på klass
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input w-full md:w-64"
              >
                <option value="all">Alla klasser</option>
                {uniqueClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Standings table */}
          {loadingStandings ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="text-gray-400 mt-2">Laddar ställning...</p>
            </div>
          ) : standings && standings.length > 0 ? (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Serieställning</h2>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-16">Plats</th>
                      <th>Namn</th>
                      <th>Klubb</th>
                      <th>Klass</th>
                      <th className="text-right">Tävlingar</th>
                      <th className="text-right">Poäng</th>
                      {series.count_best_results && (
                        <th className="text-right">Alla poäng</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => (
                      <tr key={standing.cyclist_id}>
                        <td className="font-semibold text-white">
                          {getOrdinalSuffix(index + 1)}
                        </td>
                        <td className="text-white">
                          <Link
                            to={`/cyclists/${standing.cyclist_id}`}
                            className="hover:text-primary-400 transition-colors"
                          >
                            {standing.first_name} {standing.last_name}
                          </Link>
                        </td>
                        <td className="text-gray-300">
                          {standing.club || '-'}
                        </td>
                        <td className="text-gray-300">
                          {standing.class_name}
                        </td>
                        <td className="text-right text-gray-300">
                          {standing.races_completed}
                        </td>
                        <td className="text-right font-bold text-primary-400">
                          {formatPoints(standing.total_points)}
                        </td>
                        {series.count_best_results && (
                          <td className="text-right text-xs text-gray-400">
                            {standing.all_points?.join(', ') || '-'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                {standings.length} deltagare
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-400">
                Inga resultat finns registrerade för denna serie än.
              </p>
            </div>
          )}
        </>
      )}

      {/* Club standings */}
      {series.type === 'club' && (
        <>
          {loadingClubStandings ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="text-gray-400 mt-2">Laddar klubbställning...</p>
            </div>
          ) : clubStandings && clubStandings.length > 0 ? (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Klubbställning</h2>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-16">Plats</th>
                      <th>Klubb</th>
                      <th className="text-right">Aktiva Åkare</th>
                      <th className="text-right">Räknande Resultat</th>
                      <th className="text-right">Totala Poäng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubStandings.map((standing, index) => (
                      <tr key={standing.club_name}>
                        <td className="font-semibold text-white">
                          {getOrdinalSuffix(index + 1)}
                        </td>
                        <td className="text-white font-medium">
                          {standing.club_name}
                        </td>
                        <td className="text-right text-gray-300">
                          {standing.active_cyclists}
                        </td>
                        <td className="text-right text-gray-300">
                          {standing.counting_results}
                        </td>
                        <td className="text-right font-bold text-primary-400">
                          {formatPoints(standing.total_points)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                {clubStandings.length} klubbar
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-400">
                Inga klubbresultat finns registrerade för denna serie än.
              </p>
            </div>
          )}
        </>
      )}

      {/* Point system */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Poängsystem</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {series.point_system.map((points, index) => (
            <div
              key={index}
              className="text-center p-2 bg-dark-800 rounded"
            >
              <div className="text-xs text-gray-400">{getOrdinalSuffix(index + 1)}</div>
              <div className="text-sm font-bold text-white">{points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
