import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { translateFormat } from '../lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Statistics() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const years = [2023, 2024, 2025, 2026];

  // Fetch overview statistics
  const { data: overview } = useQuery({
    queryKey: ['stats-overview', selectedYear],
    queryFn: async () => {
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;

      const [competitions, cyclists, series, results] = await Promise.all([
        supabase
          .from('competitions')
          .select('id', { count: 'exact', head: true })
          .gte('date', yearStart)
          .lte('date', yearEnd),
        supabase
          .from('cyclists')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('series')
          .select('id', { count: 'exact', head: true })
          .eq('year', selectedYear),
        supabase
          .from('results')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', yearStart)
          .lte('created_at', yearEnd),
      ]);

      return {
        competitions: competitions.count || 0,
        cyclists: cyclists.count || 0,
        series: series.count || 0,
        results: results.count || 0,
      };
    },
  });

  // Fetch competitions by month
  const { data: competitionsByMonth } = useQuery({
    queryKey: ['stats-competitions-by-month', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('date')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)
        .order('date');

      if (error) throw error;

      // Group by month
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'][i],
        count: 0,
      }));

      data.forEach((comp) => {
        const monthIndex = new Date(comp.date).getMonth();
        months[monthIndex].count++;
      });

      return months;
    },
  });

  // Fetch competitions by format
  const { data: competitionsByFormat } = useQuery({
    queryKey: ['stats-competitions-by-format', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('competition_format')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);

      if (error) throw error;

      // Group by format
      const formatCounts: Record<string, number> = {};
      data.forEach((comp) => {
        const format = comp.competition_format;
        formatCounts[format] = (formatCounts[format] || 0) + 1;
      });

      return Object.entries(formatCounts).map(([format, count]) => ({
        format: translateFormat(format),
        count,
      }));
    },
  });

  // Fetch most active cyclists
  const { data: activeCyclists } = useQuery({
    queryKey: ['stats-active-cyclists', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cyclist_stats', {
        year_param: selectedYear,
      });

      if (error) {
        console.log('RPC not available, using fallback query');
        // Fallback: manual query
        const { data: results, error: resultsError } = await supabase
          .from('results')
          .select('cyclist_id, status, position, cyclist:cyclists(first_name, last_name)')
          .gte('created_at', `${selectedYear}-01-01`)
          .lte('created_at', `${selectedYear}-12-31`);

        if (resultsError) throw resultsError;

        // Group by cyclist
        const cyclistStats: Record<string, any> = {};
        (results as any[]).forEach((result) => {
          if (!result.cyclist) return;

          const cyclistId = result.cyclist_id;
          if (!cyclistStats[cyclistId]) {
            cyclistStats[cyclistId] = {
              cyclist_id: cyclistId,
              cyclist_name: `${result.cyclist.first_name} ${result.cyclist.last_name}`,
              total_races: 0,
              finishes: 0,
              wins: 0,
              podiums: 0,
            };
          }

          cyclistStats[cyclistId].total_races++;
          if (result.status === 'FIN') {
            cyclistStats[cyclistId].finishes++;
            if (result.position === 1) cyclistStats[cyclistId].wins++;
            if (result.position <= 3) cyclistStats[cyclistId].podiums++;
          }
        });

        return Object.values(cyclistStats)
          .sort((a: any, b: any) => b.total_races - a.total_races)
          .slice(0, 10);
      }

      return data.slice(0, 10);
    },
  });

  // Fetch results by status
  const { data: resultsByStatus } = useQuery({
    queryKey: ['stats-results-by-status', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select('status')
        .gte('created_at', `${selectedYear}-01-01`)
        .lte('created_at', `${selectedYear}-12-31`);

      if (error) throw error;

      // Group by status
      const statusCounts: Record<string, number> = {};
      data.forEach((result) => {
        statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
      });

      const statusNames: Record<string, string> = {
        FIN: 'Målgång',
        DNF: 'Brutit',
        DNS: 'Startade ej',
        DSQ: 'Diskvalificerad',
      };

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: statusNames[status] || status,
        value: count,
      }));
    },
  });

  // Fetch most popular venues
  const { data: popularVenues } = useQuery({
    queryKey: ['stats-popular-venues', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('venue_id, venue:venues(name)')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);

      if (error) throw error;

      // Group by venue
      const venueCounts: Record<string, { name: string; count: number }> = {};
      (data as any[]).forEach((comp) => {
        if (!comp.venue) return;
        const venueId = comp.venue_id;
        if (!venueCounts[venueId]) {
          venueCounts[venueId] = {
            name: comp.venue.name,
            count: 0,
          };
        }
        venueCounts[venueId].count++;
      });

      return Object.values(venueCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Statistik</h1>
      </div>

      {/* Year filter */}
      <div className="card p-6">
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

      {/* Overview stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-6">
            <div className="text-3xl font-bold text-primary-400">{overview.competitions}</div>
            <div className="text-sm text-gray-400 mt-1">Tävlingar</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-bold text-green-400">{overview.results}</div>
            <div className="text-sm text-gray-400 mt-1">Resultat</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-bold text-blue-400">{overview.series}</div>
            <div className="text-sm text-gray-400 mt-1">Serier</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-bold text-purple-400">{overview.cyclists}</div>
            <div className="text-sm text-gray-400 mt-1">Cyklister (totalt)</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitions by month */}
        {competitionsByMonth && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Tävlingar per månad</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={competitionsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Antal tävlingar"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Competitions by format */}
        {competitionsByFormat && competitionsByFormat.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Tävlingar per format</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competitionsByFormat}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="format" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Antal" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Results by status */}
        {resultsByStatus && resultsByStatus.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Resultatfördelning</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resultsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(item) => `${item.name}: ${item.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resultsByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Popular venues */}
        {popularVenues && popularVenues.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Populäraste banor</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularVenues} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" name="Antal tävlingar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Most active cyclists */}
      {activeCyclists && activeCyclists.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Mest aktiva cyklister</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cyklist</th>
                  <th className="text-right">Tävlingar</th>
                  <th className="text-right">Målgångar</th>
                  <th className="text-right">Segrar</th>
                  <th className="text-right">Pallplatser</th>
                </tr>
              </thead>
              <tbody>
                {activeCyclists.map((cyclist: any, index: number) => (
                  <tr key={cyclist.cyclist_id || index}>
                    <td className="text-white font-medium">
                      {cyclist.cyclist_name}
                    </td>
                    <td className="text-right text-gray-300">{cyclist.total_races}</td>
                    <td className="text-right text-green-400">{cyclist.finishes}</td>
                    <td className="text-right text-yellow-400">{cyclist.wins}</td>
                    <td className="text-right text-orange-400">{cyclist.podiums}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
