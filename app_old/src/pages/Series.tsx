import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Series } from '../types/database';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function SeriesPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch series
  const { data: series, isLoading, error } = useQuery({
    queryKey: ['series', selectedYear, selectedType],
    queryFn: async () => {
      let query = supabase
        .from('series')
        .select('*')
        .eq('published', true)
        .order('name');

      // Filter by year
      query = query.eq('year', selectedYear);

      // Filter by type
      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Series[];
    },
  });

  // Get available years
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Serier</h1>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Year filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              År
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input w-full"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Typ
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input w-full"
            >
              <option value="all">Alla</option>
              <option value="individual">Individuell</option>
              <option value="club">Klubb</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="card p-6 border-red-700 bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Fel vid hämtning av serier
          </h3>
          <p className="text-sm text-red-300">{error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-4">Laddar serier...</p>
        </div>
      )}

      {/* Series list */}
      {!isLoading && series && (
        <>
          {series.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">
                Inga serier hittades för de valda filtren.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {series.map((serie) => (
                <Link
                  key={serie.id}
                  to={`/series/${serie.id}`}
                  className="card p-6 hover:border-primary-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-white flex-1">
                      {serie.name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      serie.type === 'individual'
                        ? 'bg-gsblue-900 text-gsblue-300'
                        : 'bg-purple-900 text-purple-300'
                    }`}>
                      {serie.type === 'individual' ? 'Individuell' : 'Klubb'}
                    </span>
                  </div>

                  {serie.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {serie.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">År:</span>
                      <span>{serie.year}</span>
                    </div>

                    {serie.count_best_results && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Räknas bästa:</span>
                        <span>{serie.count_best_results} resultat</span>
                      </div>
                    )}

                    {serie.type === 'club' && serie.club_top_riders_per_class && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Per klass:</span>
                        <span>{serie.club_top_riders_per_class} åkare</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Poängsystem:</span>
                      <span>{serie.point_system.length} placeringar</span>
                    </div>
                  </div>

                  <div className="mt-4 text-primary-400 text-sm font-medium">
                    Visa ställning →
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Count */}
          {series.length > 0 && (
            <div className="text-center text-sm text-gray-400">
              Visar {series.length} serie{series.length !== 1 ? 'r' : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
}
