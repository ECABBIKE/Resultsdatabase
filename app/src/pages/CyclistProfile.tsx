import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Cyclist } from '../types/database';
import { formatDateShort, formatTime, formatUCIID, calculateAge, getOrdinalSuffix, translateStatus } from '../lib/utils';

export default function CyclistProfile() {
  const { id } = useParams<{ id: string }>();

  // Fetch cyclist details
  const { data: cyclist, isLoading: loadingCyclist, error: cyclistError } = useQuery({
    queryKey: ['cyclist', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cyclists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Cyclist;
    },
    enabled: !!id,
  });

  // Fetch cyclist's results
  const { data: results, isLoading: loadingResults } = useQuery({
    queryKey: ['cyclist-results', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          competition:competitions(id, name, date, competition_format),
          class:competition_classes(name)
        `)
        .eq('cyclist_id', id)
        .order('competition(date)', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  if (loadingCyclist) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-gray-400 mt-4">Laddar cyklist...</p>
      </div>
    );
  }

  if (cyclistError || !cyclist) {
    return (
      <div className="card p-6 border-red-700 bg-red-900/20">
        <h3 className="text-lg font-semibold text-red-400 mb-2">
          Kunde inte ladda cyklist
        </h3>
        <p className="text-sm text-red-300">
          {cyclistError?.message || 'Cyklisten hittades inte'}
        </p>
        <Link to="/cyclists" className="btn-primary inline-block mt-4">
          ← Tillbaka till cyklister
        </Link>
      </div>
    );
  }

  const age = calculateAge(cyclist.birth_date);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/cyclists"
        className="inline-flex items-center text-primary-400 hover:text-primary-300"
      >
        ← Tillbaka till cyklister
      </Link>

      {/* Cyclist header */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          {cyclist.profile_image_url ? (
            <img
              src={cyclist.profile_image_url}
              alt={`${cyclist.first_name} ${cyclist.last_name}`}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-dark-700 flex items-center justify-center">
              <span className="text-4xl text-gray-500">
                {cyclist.first_name[0]}{cyclist.last_name[0]}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {cyclist.first_name} {cyclist.last_name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mt-4">
              {cyclist.club && (
                <div>
                  <span className="text-gray-400">Klubb:</span>
                  <span className="text-white ml-2">{cyclist.club}</span>
                </div>
              )}

              {cyclist.uci_id && (
                <div>
                  <span className="text-gray-400">UCI ID:</span>
                  <span className="text-white ml-2 font-mono">{formatUCIID(cyclist.uci_id)}</span>
                </div>
              )}

              {cyclist.birth_date && (
                <div>
                  <span className="text-gray-400">Ålder:</span>
                  <span className="text-white ml-2">
                    {age} år {cyclist.birth_date && `(${formatDateShort(cyclist.birth_date)})`}
                  </span>
                </div>
              )}

              {cyclist.gender && (
                <div>
                  <span className="text-gray-400">Kön:</span>
                  <span className="text-white ml-2 capitalize">{cyclist.gender}</span>
                </div>
              )}

              {cyclist.email && (
                <div>
                  <span className="text-gray-400">E-post:</span>
                  <a href={`mailto:${cyclist.email}`} className="text-primary-400 ml-2 hover:text-primary-300">
                    {cyclist.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {results && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-2xl font-bold text-primary-400">{results.length}</div>
            <div className="text-sm text-gray-400">Totalt tävlingar</div>
          </div>

          <div className="card p-4">
            <div className="text-2xl font-bold text-green-400">
              {results.filter(r => r.status === 'FIN').length}
            </div>
            <div className="text-sm text-gray-400">Målgångar</div>
          </div>

          <div className="card p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {results.filter(r => r.position === 1 && r.status === 'FIN').length}
            </div>
            <div className="text-sm text-gray-400">Segrar</div>
          </div>

          <div className="card p-4">
            <div className="text-2xl font-bold text-orange-400">
              {results.filter(r => r.position <= 3 && r.status === 'FIN').length}
            </div>
            <div className="text-sm text-gray-400">Pallplatser</div>
          </div>
        </div>
      )}

      {/* Results history */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Resultathistorik</h2>

        {loadingResults ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="text-gray-400 mt-2">Laddar resultat...</p>
          </div>
        ) : results && results.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Tävling</th>
                  <th>Klass</th>
                  <th className="text-right">Placering</th>
                  <th className="text-right">Tid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td className="text-gray-300">
                      {formatDateShort(result.competition.date)}
                    </td>
                    <td>
                      <Link
                        to={`/competitions/${result.competition.id}`}
                        className="text-white hover:text-primary-400 transition-colors"
                      >
                        {result.competition.name}
                      </Link>
                    </td>
                    <td className="text-gray-300">
                      {result.class?.name || '-'}
                    </td>
                    <td className="text-right font-semibold text-white">
                      {result.status === 'FIN' ? getOrdinalSuffix(result.position) : '-'}
                    </td>
                    <td className="text-right font-mono text-gray-300">
                      {formatTime(result.total_time)}
                    </td>
                    <td>
                      <span className={`text-sm ${
                        result.status === 'FIN' ? 'text-green-400' :
                        result.status === 'DNF' ? 'text-orange-400' :
                        result.status === 'DNS' ? 'text-gray-400' :
                        'text-red-400'
                      }`}>
                        {translateStatus(result.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            Inga resultat registrerade än.
          </p>
        )}
      </div>
    </div>
  );
}
