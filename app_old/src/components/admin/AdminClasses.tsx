import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { CompetitionClass } from '../../types/database';
import Button from '../Button';

export default function AdminClasses() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CompetitionClass>>({
    name: '',
    gender: null,
    age_group: null,
    description: null,
  });
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch classes
  const { data: classes, isLoading } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_classes')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as CompetitionClass[];
    },
  });

  const handleEdit = (cls: CompetitionClass) => {
    setEditingId(cls.id);
    setFormData({
      name: cls.name,
      gender: cls.gender,
      age_group: cls.age_group,
      description: cls.description,
    });
    setIsEditing(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      gender: null,
      age_group: null,
      description: null,
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
      // Clean up formData - convert empty strings to null
      const cleanData = {
        ...formData,
        gender: formData.gender || null,
        age_group: formData.age_group || null,
        description: formData.description || null,
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('competition_classes')
          .update(cleanData)
          .eq('id', editingId);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Klass uppdaterad!' });
      } else {
        // Create new
        const { error } = await supabase.from('competition_classes').insert(cleanData);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Klass skapad!' });
      }

      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['competition-classes'] });
      handleCancel();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna klass? Detta kan påverka befintliga resultat.')) return;

    try {
      const { error } = await supabase.from('competition_classes').delete().eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['competition-classes'] });
      setMessage({ type: 'success', text: 'Klass borttagen!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Fel: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Klasser</h2>
          <p className="text-gray-400 mt-1">
            {classes?.length || 0} klasser registrerade
          </p>
          <p className="text-xs text-gray-500 mt-2">
            💡 <strong>Tips:</strong> Klasser skapas automatiskt vid resultatimport, men kan redigeras här
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleNew} icon={<span className="text-xl">+</span>}>
            Skapa ny klass
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
            {editingId ? 'Redigera klass' : 'Skapa ny klass'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Klassnamn * <span className="text-gray-500 text-xs">(t.ex. Elite Men, Junior Women)</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
                placeholder="Elite Men"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kön <span className="text-gray-500 text-xs">(valfritt)</span>
                </label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value || null })}
                  className="input w-full"
                >
                  <option value="">-- Inget specificerat --</option>
                  <option value="Men">Men / Herr</option>
                  <option value="Women">Women / Dam</option>
                  <option value="Mixed">Mixed / Blandad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Åldersgrupp <span className="text-gray-500 text-xs">(valfritt)</span>
                </label>
                <input
                  type="text"
                  value={formData.age_group || ''}
                  onChange={(e) => setFormData({ ...formData, age_group: e.target.value || null })}
                  className="input w-full"
                  placeholder="t.ex. Junior, Elite, Master"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beskrivning <span className="text-gray-500 text-xs">(valfritt)</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                className="input w-full"
                rows={2}
                placeholder="Beskrivning av klassen..."
              />
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

      {/* Classes List */}
      {!isEditing && (
        <>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Laddar klasser...</div>
          ) : classes && classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="card p-5 hover:border-primary-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{cls.name}</h3>
                      {cls.description && (
                        <p className="text-sm text-gray-400 mt-1">{cls.description}</p>
                      )}
                    </div>
                  </div>

                  {(cls.gender || cls.age_group) && (
                    <div className="flex gap-2 mb-4">
                      {cls.gender && (
                        <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded">
                          {cls.gender}
                        </span>
                      )}
                      {cls.age_group && (
                        <span className="px-2 py-1 bg-accent-400/20 text-accent-300 text-xs rounded">
                          {cls.age_group}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(cls)}
                      icon={<span>✏️</span>}
                      fullWidth
                    >
                      Redigera
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(cls.id)}
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
              <p className="text-gray-400">Inga klasser registrerade än.</p>
              <p className="text-sm text-gray-500 mt-2">
                Klasser skapas automatiskt när du importerar resultat
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
