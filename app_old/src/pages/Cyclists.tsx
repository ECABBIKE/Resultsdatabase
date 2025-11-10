import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Cyclist } from '../types/database';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { formatUCIID } from '../lib/utils';

export default function Cyclists() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'club'>('name');

  // Fetch cyclists
  const { data: cyclists, isLoading, error } = useQuery({
    queryKey: ['cyclists', sortBy],
    queryFn: async () => {
      let query = supabase
        .from('cyclists')
        .select('*');

      // Sort
      if (sortBy === 'name') {
        query = query.order('last_name').order('first_name');
      } else {
        query = query.order('club').order('last_name');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Cyclist[];
    },
  });

  // Filter cyclists based on search
  const filteredCyclists = cyclists?.filter((cyclist) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cyclist.first_name.toLowerCase().includes(searchLower) ||
      cyclist.last_name.toLowerCase().includes(searchLower) ||
      cyclist.club?.toLowerCase().includes(searchLower) ||
      cyclist.uci_id?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Cyklister</h1>
      </div>

      {/* Search and sort */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sök
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sök på namn, klubb eller UCI ID..."
              className="input w-full"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sortera
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'club')}
              className="input w-full"
            >
              <option value="name">Namn</option>
              <option value="club">Klubb</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="card p-6 border-red-700 bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Fel vid hämtning av cyklister
          </h3>
          <p className="text-sm text-red-300">{error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-4">Laddar cyklister...</p>
        </div>
      )}

      {/* Cyclists list */}
      {!isLoading && filteredCyclists && (
        <>
          {filteredCyclists.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">
                {searchTerm
                  ? 'Inga cyklister matchade din sökning.'
                  : 'Inga cyklister hittades.'}
              </p>
            </div>
          ) : (
            <div className="card p-6">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Namn</th>
                      <th>Klubb</th>
                      <th>UCI ID</th>
                      <th className="text-right">Åtgärd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCyclists.map((cyclist) => (
                      <tr key={cyclist.id}>
                        <td className="text-white font-medium">
                          {cyclist.first_name} {cyclist.last_name}
                        </td>
                        <td className="text-gray-300">
                          {cyclist.club || '-'}
                        </td>
                        <td className="text-gray-400 font-mono text-sm">
                          {cyclist.uci_id ? formatUCIID(cyclist.uci_id) : '-'}
                        </td>
                        <td className="text-right">
                          <Link
                            to={`/cyclists/${cyclist.id}`}
                            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                          >
                            Visa profil →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-400">
                Visar {filteredCyclists.length} av {cyclists?.length || 0} cyklister
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
