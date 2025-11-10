import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CompetitionWithVenue, Series } from '../types/database';
import { formatDateShort, translateFormat, translateStatus, getStatusColor } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Competitions() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedSeries, setSelectedSeries] = useState<string>('all');

  const years = [2023, 2024, 2025, 2026];

  // Fetch series for selected year
  const { data: series } = useQuery({
    queryKey: ['series-for-year', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('series')
        .select('id, name')
        .eq('year', selectedYear)
        .eq('published', true)
        .order('name');

      if (error) throw error;
      return data as Series[];
    },
  });

  // Fetch competitions
  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['competitions', selectedYear, selectedSeries],
    queryFn: async () => {
      let query = supabase
        .from('competitions')
        .select('*, venue:venues(*)')
        .eq('published', true)
        .order('date', { ascending: false });

      // Filter by year
      query = query.gte('date', `${selectedYear}-01-01`).lte('date', `${selectedYear}-12-31`);

      // Filter by series
      if (selectedSeries !== 'all') {
        // Get competitions that are in the selected series
        const { data: seriesComps } = await supabase
          .from('series_competitions')
          .select('competition_id')
          .eq('series_id', selectedSeries);

        if (seriesComps && seriesComps.length > 0) {
          const compIds = seriesComps.map((sc) => sc.competition_id);
          query = query.in('id', compIds);
        } else {
          // No competitions in this series, return empty
          return [];
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CompetitionWithVenue[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Resultat</h1>
      </div>

      {/* Filters */}
      <div className="card p-6 space-y-6">
        {/* Year filter - Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            År
          </label>
          <div className="flex flex-wrap gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => {
                  setSelectedYear(year);
                  setSelectedSeries('all'); // Reset series when year changes
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Series filter - Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Serie
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSeries('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedSeries === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
              }`}
            >
              Alla serier
            </button>
            {series?.map((serie) => (
              <button
                key={serie.id}
                onClick={() => setSelectedSeries(serie.id)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedSeries === serie.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
                }`}
              >
                {serie.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="card p-6 border-red-700 bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Fel vid hämtning av resultat
          </h3>
          <p className="text-sm text-red-300">{error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-4">Laddar resultat...</p>
        </div>
      )}

      {/* Competitions list */}
      {!isLoading && competitions && (
        <>
          {competitions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">
                Inga resultat hittades för de valda filtren.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((competition) => (
                <Link
                  key={competition.id}
                  to={`/competitions/${competition.id}`}
                  className="card p-6 hover:border-primary-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white flex-1">
                      {competition.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        competition.status
                      )}`}
                    >
                      {translateStatus(competition.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-400">
                      <span className="mr-2">📅</span>
                      <span>{formatDateShort(competition.date)}</span>
                    </div>

                    <div className="flex items-center text-gray-400">
                      <span className="mr-2">🚴</span>
                      <span>{translateFormat(competition.competition_format)}</span>
                    </div>

                    {competition.venue && (
                      <div className="flex items-center text-gray-400">
                        <span className="mr-2">📍</span>
                        <span>
                          {competition.venue.name}
                          {competition.venue.city && `, ${competition.venue.city}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {competition.description && (
                    <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                      {competition.description}
                    </p>
                  )}

                  <div className="mt-4 text-primary-400 text-sm font-medium">
                    Visa resultat →
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Count */}
          {competitions.length > 0 && (
            <div className="text-center text-sm text-gray-400">
              Visar {competitions.length} tävling{competitions.length !== 1 ? 'ar' : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
}
