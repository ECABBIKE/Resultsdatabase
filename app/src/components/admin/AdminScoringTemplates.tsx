import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { ScoringTemplate, ScoringTemplateFormat } from '../../types/database';
import Button from '../Button';

export default function AdminScoringTemplates() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ScoringTemplate>>({
    name: '',
    format_type: 'enduro',
    description: '',
    points_map: {},
    dnf_points: 0,
    dns_points: 0,
    is_active: true,
  });
  const [pointsText, setPointsText] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch scoring templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['scoring-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scoring_templates')
        .select('*')
        .order('format_type')
        .order('name');

      if (error) throw error;
      return data as ScoringTemplate[];
    },
  });

  const handleEdit = (template: ScoringTemplate) => {
    setEditingId(template.id);
    setFormData(template);
    // Convert points_map to text format
    const pointsEntries = Object.entries(template.points_map)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([pos, points]) => `${pos}:${points}`)
      .join(', ');
    setPointsText(pointsEntries);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      format_type: 'enduro',
      description: '',
      points_map: {},
      dnf_points: 0,
      dns_points: 0,
      is_active: true,
    });
    setPointsText('');
  };

  const parsePointsText = (text: string): Record<string, number> => {
    const pointsMap: Record<string, number> = {};
    const entries = text.split(',').map((s) => s.trim());

    for (const entry of entries) {
      const [pos, points] = entry.split(':').map((s) => s.trim());
      if (pos && points) {
        pointsMap[pos] = parseInt(points);
      }
    }

    return pointsMap;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const pointsMap = parsePointsText(pointsText);

      if (Object.keys(pointsMap).length === 0) {
        setMessage({ type: 'error', text: 'Poängkarta får inte vara tom' });
        return;
      }

      const templateData = {
        ...formData,
        points_map: pointsMap,
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('scoring_templates')
          .update(templateData)
          .eq('id', editingId);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Mall uppdaterad!' });
      } else {
        // Create new
        const { error } = await supabase.from('scoring_templates').insert(templateData);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Mall skapad!' });
      }

      queryClient.invalidateQueries({ queryKey: ['scoring-templates'] });
      handleCancel();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna mall?')) return;

    try {
      const { error } = await supabase.from('scoring_templates').delete().eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['scoring-templates'] });
      setMessage({ type: 'success', text: 'Mall borttagen!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  const handleToggleActive = async (template: ScoringTemplate) => {
    try {
      const { error } = await supabase
        .from('scoring_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['scoring-templates'] });
      setMessage({
        type: 'success',
        text: template.is_active ? 'Mall inaktiverad' : 'Mall aktiverad',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  const formatTypeLabels: Record<ScoringTemplateFormat, string> = {
    enduro: 'Enduro',
    dh_seeding: 'DH - Seedning',
    dh_final: 'DH - Final',
    xc: 'XC',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Kvalpoängsmallar</h2>
          <p className="text-gray-400 mt-1">
            Hantera poängmallar för olika tävlingsformat
          </p>
        </div>
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            icon={<span className="text-xl">+</span>}
          >
            Skapa ny mall
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

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="card p-6 border-2 border-orange-500/30">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Redigera mall' : 'Skapa ny mall'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mallnamn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                  placeholder="t.ex. Enduro - UCI Standard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Format *
                </label>
                <select
                  value={formData.format_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      format_type: e.target.value as ScoringTemplateFormat,
                    })
                  }
                  className="input w-full"
                  required
                >
                  <option value="enduro">Enduro</option>
                  <option value="dh_seeding">DH - Seedning</option>
                  <option value="dh_final">DH - Final</option>
                  <option value="xc">XC</option>
                </select>
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
                rows={2}
                placeholder="Beskrivning av poängmallen..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Poängkarta * (format: 1:500, 2:450, 3:425, ...)
              </label>
              <textarea
                value={pointsText}
                onChange={(e) => setPointsText(e.target.value)}
                className="input w-full font-mono text-sm"
                rows={4}
                required
                placeholder="1:500, 2:450, 3:425, 4:405, 5:390, ..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Ange placering och poäng separerade med kolon, kommaseparerade
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  DNF Poäng
                </label>
                <input
                  type="number"
                  value={formData.dnf_points}
                  onChange={(e) =>
                    setFormData({ ...formData, dnf_points: parseInt(e.target.value) })
                  }
                  className="input w-full"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  DNS Poäng
                </label>
                <input
                  type="number"
                  value={formData.dns_points}
                  onChange={(e) =>
                    setFormData({ ...formData, dns_points: parseInt(e.target.value) })
                  }
                  className="input w-full"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300">
                Aktiv mall
              </label>
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

      {/* Templates List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Laddar mallar...</div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`card p-6 ${
                !template.is_active ? 'opacity-60 border-dashed' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{template.name}</h3>
                  <p className="text-sm text-orange-400 font-medium mt-1">
                    {formatTypeLabels[template.format_type]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {template.is_active ? (
                    <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                      Aktiv
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-900/30 text-gray-500 text-xs rounded">
                      Inaktiv
                    </span>
                  )}
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-gray-400 mb-4">{template.description}</p>
              )}

              <div className="bg-dark-700 rounded p-3 mb-4">
                <div className="text-xs text-gray-500 mb-2">Poängfördelning:</div>
                <div className="font-mono text-sm text-gray-300 max-h-20 overflow-y-auto">
                  {Object.entries(template.points_map)
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                    .slice(0, 10)
                    .map(([pos, points]) => (
                      <span key={pos} className="inline-block mr-3">
                        {pos}:{points}
                      </span>
                    ))}
                  {Object.keys(template.points_map).length > 10 && (
                    <span className="text-gray-500">
                      ... (+{Object.keys(template.points_map).length - 10} fler)
                    </span>
                  )}
                </div>
                {(template.dnf_points > 0 || template.dns_points > 0) && (
                  <div className="text-xs text-gray-500 mt-2">
                    {template.dnf_points > 0 && `DNF: ${template.dnf_points}p `}
                    {template.dns_points > 0 && `DNS: ${template.dns_points}p`}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(template)}
                  icon={<span>✏️</span>}
                >
                  Redigera
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleActive(template)}
                >
                  {template.is_active ? 'Inaktivera' : 'Aktivera'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(template.id)}
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
          <p className="text-gray-400">Inga poängmallar skapade än.</p>
        </div>
      )}
    </div>
  );
}
