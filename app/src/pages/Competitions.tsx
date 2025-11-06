import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CompetitionWithVenue } from '../types/database';
import { formatDateShort, translateFormat, translateStatus, getStatusColor } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Competitions() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch competitions
  const { data: competitions, isLoading, error } = useQuery({
    queryKey: ['competitions', selectedYear, selectedFormat, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('competitions')
        .select('*, venue:venues(*)')
        .eq('published', true)
        .order('date', { ascending: false });

      // Filter by year
      query = query.gte('date', `${selectedYear}-01-01`).lte('date', `${selectedYear}-12-31`);

      // Filter by format
      if (selectedFormat !== 'all') {
        query = query.eq('competition_format', selectedFormat);
      }

      // Filter by status
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CompetitionWithVenue[];
    },
  });

  // Get available years (current year +/- 2)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Tävlingar</h1>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Format filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="input w-full"
            >
              <option value="all">Alla</option>
              <option value="DH">Downhill</option>
              <option value="ENDURO">Enduro</option>
              <option value="XC">Cross Country</option>
              <option value="OTHER">Annat</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input w-full"
            >
              <option value="all">Alla</option>
              <option value="upcoming">Kommande</option>
              <option value="ongoing">Pågående</option>
              <option value="completed">Avslutad</option>
              <option value="cancelled">Inställd</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="card p-6 border-red-700 bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Fel vid hämtning av tävlingar
          </h3>
          <p className="text-sm text-red-300">{error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-gray-400 mt-4">Laddar tävlingar...</p>
        </div>
      )}

      {/* Competitions list */}
      {!isLoading && competitions && (
        <>
          {competitions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">
                Inga tävlingar hittades för de valda filtren.
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
