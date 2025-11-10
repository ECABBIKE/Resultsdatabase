import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CompetitionWithVenue, Series } from '../types/database';
import { formatDateShort, translateFormat, translateStatus, getStatusColor } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Home() {
  // Fetch latest competitions
  const { data: competitions, isLoading: loadingCompetitions, error: competitionsError } = useQuery({
    queryKey: ['latest-competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*, venue:venues(*)')
        .eq('published', true)
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as CompetitionWithVenue[];
    },
  });

  // Fetch active series
  const { data: series, isLoading: loadingSeries, error: seriesError } = useQuery({
    queryKey: ['active-series'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('published', true)
        .eq('year', new Date().getFullYear())
        .order('name');

      if (error) throw error;
      return data as Series[];
    },
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-900 to-dark-800 rounded-lg p-8 border border-primary-800">
        <h1 className="text-4xl font-bold text-white mb-4">
          Välkommen till GravitySeries - The HUB
        </h1>
        <p className="text-xl text-gray-300">
          Din kompletta plattform för mountainbike-tävlingar i Sverige
        </p>
      </div>

      {/* Error Messages */}
      {(competitionsError || seriesError) && (
        <div className="card p-6 border-red-700 bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Fel vid hämtning av data
          </h3>
          {competitionsError && (
            <p className="text-sm text-red-300 mb-2">
              Tävlingar: {competitionsError.message}
            </p>
          )}
          {seriesError && (
            <p className="text-sm text-red-300">
              Serier: {seriesError.message}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-4">
            Kontrollera att Supabase är korrekt konfigurerat och att databasen innehåller data.
          </p>
        </div>
      )}

      {/* Latest Competitions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Senaste tävlingarna</h2>
          <Link
            to="/competitions"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            Visa alla →
          </Link>
        </div>

        {loadingCompetitions ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : competitions && competitions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {competitions.map((competition) => (
              <Link
                key={competition.id}
                to={`/competitions/${competition.id}`}
                className="card p-6 hover:border-primary-700 transition-colors"
              >
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
                <p className="text-sm text-gray-400 mb-2">
                  {translateFormat(competition.competition_format)}
                </p>
                <p className="text-sm text-gray-300">
                  {formatDateShort(competition.date)}
                </p>
                {competition.venue && (
                  <p className="text-sm text-gray-400 mt-2">
                    {competition.venue.name}, {competition.venue.city}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-400">Inga tävlingar att visa än.</p>
          </div>
        )}
      </section>

      {/* Active Series */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Aktiva serier {new Date().getFullYear()}</h2>
          <Link
            to="/series"
            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            Visa alla →
          </Link>
        </div>

        {loadingSeries ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : series && series.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {series.map((serie) => (
              <Link
                key={serie.id}
                to={`/series/${serie.id}`}
                className="card p-6 hover:border-primary-700 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {serie.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="capitalize">{serie.type === 'individual' ? 'Individuell' : 'Klubb'}</span>
                  <span>•</span>
                  <span>{serie.year}</span>
                </div>
                {serie.description && (
                  <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                    {serie.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-400">Inga aktiva serier att visa.</p>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/cyclists"
          className="card p-6 text-center hover:border-primary-700 transition-colors"
        >
          <div className="text-3xl mb-2">🚴</div>
          <h3 className="text-lg font-semibold text-white mb-2">Cyklister</h3>
          <p className="text-sm text-gray-400">
            Utforska cyklistprofiler och historik
          </p>
        </Link>

        <Link
          to="/calendar"
          className="card p-6 text-center hover:border-primary-700 transition-colors"
        >
          <div className="text-3xl mb-2">📅</div>
          <h3 className="text-lg font-semibold text-white mb-2">Kalender</h3>
          <p className="text-sm text-gray-400">
            Se kommande tävlingar och evenemang
          </p>
        </Link>

        <Link
          to="/statistics"
          className="card p-6 text-center hover:border-primary-700 transition-colors"
        >
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-white mb-2">Statistik</h3>
          <p className="text-sm text-gray-400">
            Djupdyk i resultat och statistik
          </p>
        </Link>
      </section>
    </div>
  );
}
