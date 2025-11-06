import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CompetitionWithVenue } from '../types/database';
import { translateFormat, translateStatus, getStatusColor } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Calendar() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'timeline' | 'month'>('timeline');

  const years = [2023, 2024, 2025, 2026];
  const months = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  // Fetch competitions for the selected year
  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['calendar-competitions', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*, venue:venues(*)')
        .eq('published', true)
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as CompetitionWithVenue[];
    },
  });

  // Group competitions by month
  const competitionsByMonth = competitions?.reduce((acc, competition) => {
    const date = new Date(competition.date);
    const monthIndex = date.getMonth();
    if (!acc[monthIndex]) {
      acc[monthIndex] = [];
    }
    acc[monthIndex].push(competition);
    return acc;
  }, {} as Record<number, CompetitionWithVenue[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Kalender</h1>
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
                onClick={() => setSelectedYear(year)}
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

        {/* View mode */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Vy
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
              }`}
            >
              Tidslinje
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
              }`}
            >
              Per månad
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="card p-6 border-red-700 bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Fel vid hämtning av kalender
          </h3>
          <p className="text-sm text-red-300">{error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-4">Laddar kalender...</p>
        </div>
      )}

      {/* Calendar content */}
      {!isLoading && competitions && (
        <>
          {competitions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">
                Inga tävlingar planerade för {selectedYear}.
              </p>
            </div>
          ) : (
            <>
              {/* Timeline view */}
              {viewMode === 'timeline' && (
                <div className="space-y-4">
                  {competitions.map((competition) => {
                    const date = new Date(competition.date);
                    const today = new Date();
                    const isPast = date < today;
                    const isToday = date.toDateString() === today.toDateString();

                    return (
                      <Link
                        key={competition.id}
                        to={`/competitions/${competition.id}`}
                        className="card p-6 hover:border-primary-700 transition-colors block"
                      >
                        <div className="flex items-start gap-6">
                          {/* Date badge */}
                          <div className={`flex-shrink-0 text-center p-3 rounded-lg ${
                            isToday
                              ? 'bg-green-900/30 border border-green-700'
                              : isPast
                              ? 'bg-dark-700'
                              : 'bg-primary-900/30 border border-primary-700'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              isToday ? 'text-green-400' : isPast ? 'text-gray-400' : 'text-primary-400'
                            }`}>
                              {date.getDate()}
                            </div>
                            <div className={`text-xs uppercase ${
                              isToday ? 'text-green-400' : isPast ? 'text-gray-500' : 'text-primary-400'
                            }`}>
                              {months[date.getMonth()].substring(0, 3)}
                            </div>
                          </div>

                          {/* Competition info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-white">
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

                            <div className="space-y-1 text-sm">
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
                              <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                                {competition.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Month view */}
              {viewMode === 'month' && competitionsByMonth && (
                <div className="space-y-6">
                  {months.map((month, index) => {
                    const monthCompetitions = competitionsByMonth[index];
                    if (!monthCompetitions || monthCompetitions.length === 0) {
                      return null;
                    }

                    return (
                      <div key={month} className="card p-6">
                        <h2 className="text-xl font-bold text-white mb-4">
                          {month} {selectedYear}
                        </h2>
                        <div className="space-y-3">
                          {monthCompetitions.map((competition) => (
                            <Link
                              key={competition.id}
                              to={`/competitions/${competition.id}`}
                              className="block p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-lg font-semibold text-primary-400">
                                    {new Date(competition.date).getDate()}
                                  </span>
                                  <div>
                                    <h3 className="text-white font-medium">
                                      {competition.name}
                                    </h3>
                                    <div className="text-sm text-gray-400">
                                      {translateFormat(competition.competition_format)}
                                      {competition.venue && (
                                        <> • {competition.venue.name}</>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                    competition.status
                                  )}`}
                                >
                                  {translateStatus(competition.status)}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Count */}
              <div className="text-center text-sm text-gray-400">
                {competitions.length} tävling{competitions.length !== 1 ? 'ar' : ''} under {selectedYear}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
