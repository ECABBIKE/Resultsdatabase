import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Competition, Venue, ScoringTemplate } from '../../types/database';
import { formatDateShort } from '../../lib/utils';
import Button from '../Button';

export default function AdminCompetitions() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Competition>>({
    name: '',
    date: '',
    competition_format: 'ENDURO',
    venue_id: null,
    description: '',
    status: 'upcoming',
    published: false,
    scoring_template_id: null,
    dh_seeding_template_id: null,
    dh_final_template_id: null,
  });
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch competitions
  const { data: competitions, isLoading } = useQuery({
    queryKey: ['admin-competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*, venue:venues(*)')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as (Competition & { venue: Venue | null })[];
    },
  });

  // Fetch venues
  const { data: venues } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data, error } = await supabase.from('venues').select('*').order('name');

      if (error) throw error;
      return data as Venue[];
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

  const handleEdit = (competition: Competition) => {
    setEditingId(competition.id);
    // Only set editable fields, exclude nested objects and timestamps
    setFormData({
      name: competition.name,
      date: competition.date,
      competition_format: competition.competition_format,
      venue_id: competition.venue_id,
      description: competition.description,
      status: competition.status,
      published: competition.published,
      scoring_template_id: competition.scoring_template_id,
      dh_seeding_template_id: competition.dh_seeding_template_id,
      dh_final_template_id: competition.dh_final_template_id,
    });
    setIsEditing(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      date: '',
      competition_format: 'ENDURO',
      venue_id: null,
      description: '',
      status: 'upcoming',
      published: false,
      scoring_template_id: null,
      dh_seeding_template_id: null,
      dh_final_template_id: null,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Clean up formData - convert empty strings to null for nullable fields
      const cleanData = {
        ...formData,
        venue_id: formData.venue_id || null,
        description: formData.description || null,
        scoring_template_id: formData.scoring_template_id || null,
        dh_seeding_template_id: formData.dh_seeding_template_id || null,
        dh_final_template_id: formData.dh_final_template_id || null,
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('competitions')
          .update(cleanData)
          .eq('id', editingId);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Tävling uppdaterad!' });
      } else {
        // Create new
        const { error } = await supabase.from('competitions').insert(cleanData);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Tävling skapad!' });
      }

      queryClient.invalidateQueries({ queryKey: ['admin-competitions'] });
      handleCancel();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna tävling?')) return;

    try {
      const { error } = await supabase.from('competitions').delete().eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-competitions'] });
      setMessage({ type: 'success', text: 'Tävling borttagen!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  const isDH = formData.competition_format === 'DH';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tävlingar</h2>
          <p className="text-gray-400 mt-1">
            {competitions?.length || 0} tävlingar registrerade
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleNew} icon={<span className="text-xl">+</span>}>
            Skapa ny tävling
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
              : 'bg-dark-700 border-dark-600 text-gray-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <div className="card p-6 border-2 border-primary-500/30">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Redigera tävling' : 'Skapa ny tävling'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tävlingsnamn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                  placeholder="t.ex. Järvsö Enduro 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Datum *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Format *
                </label>
                <select
                  value={formData.competition_format}
                  onChange={(e) =>
                    setFormData({ ...formData, competition_format: e.target.value as any })
                  }
                  className="input w-full"
                  required
                >
                  <option value="ENDURO">Enduro</option>
                  <option value="DH">Downhill</option>
                  <option value="XC">XC</option>
                  <option value="OTHER">Annat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Plats/Anläggning
                </label>
                <select
                  value={formData.venue_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, venue_id: e.target.value || null })
                  }
                  className="input w-full"
                >
                  <option value="">-- Välj plats --</option>
                  {venues?.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} {venue.city ? `- ${venue.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="upcoming">Kommande</option>
                  <option value="ongoing">Pågående</option>
                  <option value="completed">Avslutad</option>
                  <option value="cancelled">Inställd</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Publicerad</span>
                </label>
              </div>
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
                placeholder="Beskrivning av tävlingen..."
              />
            </div>

            {/* Scoring Templates */}
            <div className="border-t border-dark-700 pt-4">
              <h4 className="text-sm font-bold text-white mb-3">Kvalpoängsmallar</h4>

              {!isDH ? (
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
                    {templates
                      ?.filter((t) => t.format_type === formData.competition_format?.toLowerCase())
                      .map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Seedning Mall
                    </label>
                    <select
                      value={formData.dh_seeding_template_id || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dh_seeding_template_id: e.target.value || null,
                        })
                      }
                      className="input w-full"
                    >
                      <option value="">-- Ingen mall --</option>
                      {templates
                        ?.filter((t) => t.format_type === 'dh_seeding')
                        .map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Final Mall
                    </label>
                    <select
                      value={formData.dh_final_template_id || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dh_final_template_id: e.target.value || null,
                        })
                      }
                      className="input w-full"
                    >
                      <option value="">-- Ingen mall --</option>
                      {templates
                        ?.filter((t) => t.format_type === 'dh_final')
                        .map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
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

      {/* Competitions List */}
      {!isEditing && (
        <>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Laddar tävlingar...</div>
          ) : competitions && competitions.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Namn</th>
                    <th>Datum</th>
                    <th>Format</th>
                    <th>Plats</th>
                    <th>Status</th>
                    <th className="text-right">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {competitions.map((comp) => (
                    <tr key={comp.id}>
                      <td className="text-white font-medium">{comp.name}</td>
                      <td className="text-gray-300">{formatDateShort(comp.date)}</td>
                      <td>
                        <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded font-medium">
                          {comp.competition_format}
                        </span>
                      </td>
                      <td className="text-gray-300">
                        {comp.venue?.name || <span className="text-gray-500">-</span>}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            comp.published
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-gray-900/30 text-gray-400'
                          }`}
                        >
                          {comp.published ? 'Publicerad' : 'Ej publicerad'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(comp)}
                            icon={<span>✏️</span>}
                          >
                            Redigera
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(comp.id)}
                            icon={<span>🗑️</span>}
                          >
                            Ta bort
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-400">Inga tävlingar registrerade än.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
