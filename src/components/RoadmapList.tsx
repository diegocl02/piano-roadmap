'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Roadmap, CompletedDay } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, Plus, ChevronRight, Layers, Calendar } from 'lucide-react';

interface RoadmapListProps {
  roadmaps: Roadmap[];
  completedDays: CompletedDay[];
  onOpen: (roadmap: Roadmap) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
}

function getStats(roadmap: Roadmap, completedDays: CompletedDay[]) {
  const phases = roadmap.phases.length;
  const sprints = roadmap.phases.reduce((sum, p) => sum + p.sprints.length, 0);
  const sprintIds = new Set(roadmap.phases.flatMap((p) => p.sprints.map((s) => s.id)));
  const daysCompleted = completedDays.filter((d) => sprintIds.has(d.sprintId)).length;
  return { phases, sprints, daysCompleted };
}

export function RoadmapList({ roadmaps, completedDays, onOpen, onCreate, onRename }: RoadmapListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (creating && createInputRef.current) createInputRef.current.focus();
  }, [creating]);

  const startEdit = (roadmap: Roadmap) => {
    setEditingId(roadmap.id);
    setEditingName(roadmap.name);
  };

  const submitEdit = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const submitCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
    }
    setCreating(false);
    setNewName('');
  };

  const cancelCreate = () => {
    setCreating(false);
    setNewName('');
  };

  const handleCreateKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitCreate();
    if (e.key === 'Escape') cancelCreate();
  };

  return (
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-2">
          <div className="text-xs font-mono text-[var(--t-mute2)] tracking-widest uppercase mb-2">
            Piano Roadmap Architect
          </div>
          <h1 className="text-3xl font-bold text-[var(--t-head)]">Mis Roadmaps</h1>
          <p className="text-[var(--t-mute)] text-sm mt-1">
            Selecciona un roadmap para practicar o crea uno nuevo.
          </p>
        </div>

        {/* Roadmap Cards */}
        <div className="space-y-3 mb-4">
          {roadmaps.map((roadmap) => {
            const { phases, sprints, daysCompleted } = getStats(roadmap, completedDays);
            const isEditing = editingId === roadmap.id;

            return (
              <Card
                key={roadmap.id}
                className="bg-[var(--t-surf)] border-[var(--t-bord2)] hover:border-[var(--t-bord)] transition-colors group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Name row */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            ref={editInputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={handleEditKey}
                            onBlur={submitEdit}
                            className="flex-1 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-2 py-1 text-sm font-semibold text-[var(--t-text)] focus:outline-none focus:border-cyan-500 font-mono"
                          />
                          <button
                            onMouseDown={(e) => { e.preventDefault(); submitEdit(); }}
                            className="text-emerald-500 hover:text-emerald-400 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                            className="text-[var(--t-mute)] hover:text-[var(--t-text)] transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="font-semibold text-[var(--t-head)] text-base leading-tight truncate">
                            {roadmap.name}
                          </h2>
                          <button
                            onClick={() => startEdit(roadmap)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-all shrink-0"
                            title="Renombrar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs font-mono text-[var(--t-mute2)]">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {phases} {phases === 1 ? 'fase' : 'fases'} · {sprints} {sprints === 1 ? 'sprint' : 'sprints'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysCompleted} {daysCompleted === 1 ? 'día completado' : 'días completados'}
                        </span>
                      </div>
                    </div>

                    {/* Open button */}
                    {!isEditing && (
                      <Button
                        onClick={() => onOpen(roadmap)}
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 gap-1 shrink-0"
                      >
                        ABRIR <ChevronRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Create new card */}
          {creating ? (
            <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={createInputRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleCreateKey}
                    placeholder="Nombre del roadmap..."
                    className="flex-1 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-3 py-1.5 text-sm text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <Button
                    onClick={submitCreate}
                    size="sm"
                    disabled={!newName.trim()}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 disabled:opacity-40"
                  >
                    CREAR
                  </Button>
                  <button
                    onClick={cancelCreate}
                    className="text-[var(--t-mute)] hover:text-[var(--t-text)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full border border-dashed border-[var(--t-bord)] rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:border-[var(--t-bord)] hover:bg-[var(--t-surf)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo Roadmap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
