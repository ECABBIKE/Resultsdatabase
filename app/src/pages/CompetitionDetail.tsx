import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { CompetitionWithVenue } from '../types/database';
import {
  formatDateShort,
  formatTime,
  translateFormat,
  translateStatus,
  getStatusColor,
  getResultStatusColor,
  getOrdinalSuffix,
} from '../lib/utils';

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();

  // Fetch competition details
  const { data: competition, isLoading: loadingCompetition, error: competitionError } = useQuery({
    queryKey: ['competition', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*, venue:venues(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as CompetitionWithVenue;
    },
    enabled: !!id,
  });

  // Fetch results
  const { data: results, isLoading: loadingResults, error: resultsError } = useQuery({
    queryKey: ['results', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          cyclist:cyclists(*),
          class:competition_classes(*)
        `)
        .eq('competition_id', id)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  if (loadingCompetition) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-gray-400 mt-4">Laddar tävling...</p>
      </div>
    );
  }

  if (competitionError || !competition) {
    return (
      <div className="card p-6 border-red-700 bg-red-900/20">
        <h3 className="text-lg font-semibold text-red-400 mb-2">
          Kunde inte ladda tävling
        </h3>
        <p className="text-sm text-red-300">
          {competitionError?.message || 'Tävlingen hittades inte'}
        </p>
        <Link to="/competitions" className="btn-primary inline-block mt-4">
          ← Tillbaka till tävlingar
        </Link>
      </div>
    );
  }

  // Group results by class
  const resultsByClass = results?.reduce((acc, result) => {
    const className = result.class?.name || 'Okänd klass';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(result);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/competitions"
        className="inline-flex items-center text-primary-400 hover:text-primary-300"
      >
        ← Tillbaka till tävlingar
      </Link>

      {/* Competition header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {competition.name}
            </h1>
            {competition.description && (
              <p className="text-gray-400">{competition.description}</p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(
              competition.status
            )}`}
          >
            {translateStatus(competition.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Datum:</span>
            <span className="text-white ml-2">
              {formatDateShort(competition.date)}
            </span>
          </div>

          <div>
            <span className="text-gray-400">Format:</span>
            <span className="text-white ml-2">
              {translateFormat(competition.competition_format)}
            </span>
          </div>

          {competition.venue && (
            <div>
              <span className="text-gray-400">Plats:</span>
              <span className="text-white ml-2">
                {competition.venue.name}
                {competition.venue.city && `, ${competition.venue.city}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results error */}
      {resultsError && (
        <div className="card p-6 border-red-700 bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Fel vid hämtning av resultat
          </h3>
          <p className="text-sm text-red-300">{resultsError.message}</p>
        </div>
      )}

      {/* Results loading */}
      {loadingResults && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-2">Laddar resultat...</p>
        </div>
      )}

      {/* Results */}
      {!loadingResults && results && (
        <>
          {results.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">
                Inga resultat finns registrerade för denna tävling än.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(resultsByClass || {}).map(([className, classResults]) => (
                <div key={className} className="card p-6">
                  <h2 className="text-xl font-bold text-white mb-4">{className}</h2>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="w-16">Plac.</th>
                          <th>Namn</th>
                          <th>Klubb</th>
                          <th>Tid</th>
                          <th>Efter ledare</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(classResults as any[]).map((result: any) => (
                          <tr key={result.id}>
                            <td className="font-semibold text-white">
                              {result.status === 'FIN'
                                ? getOrdinalSuffix(result.position)
                                : '-'}
                            </td>
                            <td className="text-white">
                              <Link
                                to={`/cyclists/${result.cyclist.id}`}
                                className="hover:text-primary-400 transition-colors"
                              >
                                {result.cyclist.first_name} {result.cyclist.last_name}
                              </Link>
                            </td>
                            <td className="text-gray-300">
                              {result.cyclist.club || '-'}
                            </td>
                            <td className="font-mono text-gray-300">
                              {formatTime(result.total_time)}
                            </td>
                            <td className="font-mono text-gray-400">
                              {formatTime(result.time_behind_leader)}
                            </td>
                            <td>
                              <span className={getResultStatusColor(result.status)}>
                                {translateStatus(result.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 text-sm text-gray-400">
                    {(classResults as any[]).length} deltagare
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
