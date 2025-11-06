import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Series, Competition, ScoringTemplate } from '../../types/database';
import { formatDateShort } from '../../lib/utils';
import Button from '../Button';

export default function AdminSeries() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Series>>({
    name: '',
    year: new Date().getFullYear(),
    type: 'individual',
    point_system: [],
    count_best_results: null,
    description: '',
    published: false,
    club_top_riders_per_class: null,
    scoring_template_id: null,
  });
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch series
  const { data: series, isLoading } = useQuery({
    queryKey: ['admin-series'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .order('year', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as Series[];
    },
  });

  // Fetch competitions
  const { data: competitions } = useQuery({
    queryKey: ['admin-competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Competition[];
    },
  });

  // Fetch scoring templates
  const { data: templates } = useQuery({
    queryKey: ['scoring-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scoring_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ScoringTemplate[];
    },
  });


  const handleEdit = async (serie: Series) => {
    setEditingId(serie.id);
    setFormData(serie);
    setIsEditing(true);

    // Fetch competitions for this series
    const { data } = await supabase
      .from('series_competitions')
      .select('competition_id')
      .eq('series_id', serie.id);

    if (data) {
      setSelectedCompetitions(data.map((sc) => sc.competition_id));
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      year: new Date().getFullYear(),
      type: 'individual',
      point_system: [],
      count_best_results: null,
      description: '',
      published: false,
      club_top_riders_per_class: null,
      scoring_template_id: null,
    });
    setSelectedCompetitions([]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setSelectedCompetitions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let seriesId = editingId;

      if (editingId) {
        // Update existing
        const { error } = await supabase.from('series').update(formData).eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('series')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        seriesId = data.id;
      }

      // Update series_competitions
      if (seriesId) {
        // Delete existing
        await supabase.from('series_competitions').delete().eq('series_id', seriesId);

        // Insert new
        if (selectedCompetitions.length > 0) {
          const records = selectedCompetitions.map((compId) => ({
            series_id: seriesId!,
            competition_id: compId,
          }));

          const { error } = await supabase.from('series_competitions').insert(records);
          if (error) throw error;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      queryClient.invalidateQueries({ queryKey: ['series'] });
      setMessage({ type: 'success', text: editingId ? 'Serie uppdaterad!' : 'Serie skapad!' });
      handleCancel();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna serie?')) return;

    try {
      const { error } = await supabase.from('series').delete().eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      queryClient.invalidateQueries({ queryKey: ['series'] });
      setMessage({ type: 'success', text: 'Serie borttagen!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Serier</h2>
          <p className="text-gray-400 mt-1">{series?.length || 0} serier registrerade</p>
        </div>
        {!isEditing && (
          <Button onClick={handleNew} icon={<span className="text-xl">+</span>}>
            Skapa ny serie
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-900/20 border-green-700 text-green-300'
              : message.type === 'error'
              ? 'bg-red-900/20 border-red-700 text-red-300'
              : 'bg-blue-900/20 border-blue-700 text-blue-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <div className="card p-6 border-2 border-orange-500/30">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Redigera serie' : 'Skapa ny serie'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serienamn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                  placeholder="t.ex. Gravity Series 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">År *</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="input w-full"
                  required
                  min="2000"
                  max="2100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Typ *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="input w-full"
                  required
                >
                  <option value="individual">Individuell</option>
                  <option value="club">Klubbtävling</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Poängmall
                </label>
                <select
                  value={formData.scoring_template_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, scoring_template_id: e.target.value || null })
                  }
                  className="input w-full"
                >
                  <option value="">-- Ingen mall --</option>
                  {templates?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Räkna bästa resultat
                </label>
                <input
                  type="number"
                  value={formData.count_best_results || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      count_best_results: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="input w-full"
                  placeholder="Tom = alla resultat räknas"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lämna tom för att räkna alla resultat
                </p>
              </div>

              {formData.type === 'club' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Topp åkare per klass för klubb
                  </label>
                  <input
                    type="number"
                    value={formData.club_top_riders_per_class || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        club_top_riders_per_class: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="input w-full"
                    placeholder="t.ex. 3"
                    min="1"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beskrivning
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Beskrivning av serien..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="published" className="text-sm text-gray-300">
                Publicerad
              </label>
            </div>

            {/* Select Competitions */}
            <div className="border-t border-dark-700 pt-4">
              <h4 className="text-sm font-bold text-white mb-3">Tävlingar i serien</h4>
              <div className="bg-dark-800 rounded p-4 max-h-64 overflow-y-auto">
                {competitions && competitions.length > 0 ? (
                  <div className="space-y-2">
                    {competitions.map((comp) => (
                      <label
                        key={comp.id}
                        className="flex items-center gap-3 p-2 hover:bg-dark-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCompetitions.includes(comp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCompetitions([...selectedCompetitions, comp.id]);
                            } else {
                              setSelectedCompetitions(
                                selectedCompetitions.filter((id) => id !== comp.id)
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <span className="text-white">{comp.name}</span>
                          <span className="text-gray-400 text-sm ml-2">
                            {formatDateShort(comp.date)}
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-orange-900/30 text-orange-400 text-xs rounded">
                          {comp.competition_format}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Inga tävlingar tillgängliga</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedCompetitions.length} tävling(ar) valda
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" icon={<span>💾</span>}>
                {editingId ? 'Uppdatera' : 'Skapa'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Avbryt
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Series List */}
      {!isEditing && (
        <>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Laddar serier...</div>
          ) : series && series.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {series.map((serie) => (
                <div key={serie.id} className="card p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{serie.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {serie.year} •{' '}
                        {serie.type === 'individual' ? 'Individuell' : 'Klubbtävling'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        serie.published
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-gray-900/30 text-gray-400'
                      }`}
                    >
                      {serie.published ? 'Publicerad' : 'Ej publicerad'}
                    </span>
                  </div>

                  {serie.description && (
                    <p className="text-sm text-gray-400 mb-4">{serie.description}</p>
                  )}

                  <div className="text-sm text-gray-400 space-y-1 mb-4">
                    {serie.count_best_results && (
                      <div>Räknar bästa {serie.count_best_results} resultat</div>
                    )}
                    {serie.club_top_riders_per_class && (
                      <div>Topp {serie.club_top_riders_per_class} åkare per klass</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(serie)}
                      icon={<span>✏️</span>}
                    >
                      Redigera
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(serie.id)}
                      icon={<span>🗑️</span>}
                    >
                      Ta bort
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-400">Inga serier registrerade än.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
