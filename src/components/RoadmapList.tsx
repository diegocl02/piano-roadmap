'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Roadmap, CompletedDay } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, Plus, ChevronRight, Layers, Calendar, Trash2 } from 'lucide-react';

interface RoadmapListProps {
  roadmaps: Roadmap[];
  completedDays: CompletedDay[];
  onOpen: (roadmap: Roadmap) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onDelete: (id: string) => void;
}

function getStats(roadmap: Roadmap, completedDays: CompletedDay[]) {
  const phases = roadmap.phases.length;
  const sprints = roadmap.phases.reduce((sum, p) => sum + p.sprints.length, 0);
  const daysCompleted = completedDays.filter((d) => d.roadmapId === roadmap.id).length;
  return { phases, sprints, daysCompleted };
}

export function RoadmapList({
  roadmaps, completedDays, onOpen, onCreate, onRename, onUpdateDescription, onDelete,
}: RoadmapListProps) {
  // Name editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editNameRef = useRef<HTMLInputElement>(null);

  // Description editing
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState('');
  const editDescRef = useRef<HTMLTextAreaElement>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editNameRef.current) editNameRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (editingDescId && editDescRef.current) {
      editDescRef.current.focus();
      const len = editDescRef.current.value.length;
      editDescRef.current.setSelectionRange(len, len);
    }
  }, [editingDescId]);

  useEffect(() => {
    if (creating && createInputRef.current) createInputRef.current.focus();
  }, [creating]);

  // ── Name ──────────────────────────────────────────────────────────────────

  const startEditName = (roadmap: Roadmap) => {
    setEditingId(roadmap.id);
    setEditingName(roadmap.name);
    setDeletingId(null);
  };

  const submitName = () => {
    if (editingId && editingName.trim()) onRename(editingId, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  const cancelName = () => { setEditingId(null); setEditingName(''); };

  const handleNameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitName();
    if (e.key === 'Escape') cancelName();
  };

  // ── Description ───────────────────────────────────────────────────────────

  const startEditDesc = (roadmap: Roadmap) => {
    setEditingDescId(roadmap.id);
    setEditingDesc(roadmap.description ?? '');
    setDeletingId(null);
  };

  const submitDesc = () => {
    if (editingDescId !== null) onUpdateDescription(editingDescId, editingDesc.trim());
    setEditingDescId(null);
    setEditingDesc('');
  };

  const cancelDesc = () => { setEditingDescId(null); setEditingDesc(''); };

  const handleDescKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitDesc(); }
    if (e.key === 'Escape') cancelDesc();
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeletingId(null);
  };

  // ── Create ────────────────────────────────────────────────────────────────

  const submitCreate = () => {
    if (newName.trim()) onCreate(newName.trim());
    setCreating(false);
    setNewName('');
  };

  const cancelCreate = () => { setCreating(false); setNewName(''); };

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

        {/* Cards */}
        <div className="space-y-3 mb-4">
          {roadmaps.map((roadmap) => {
            const { phases, sprints, daysCompleted } = getStats(roadmap, completedDays);
            const isEditingName = editingId === roadmap.id;
            const isEditingDesc = editingDescId === roadmap.id;
            const isConfirmingDelete = deletingId === roadmap.id;

            return (
              <Card
                key={roadmap.id}
                className="bg-[var(--t-surf)] border-[var(--t-bord2)] hover:border-[var(--t-bord)] transition-colors group"
              >
                <CardContent className="p-4">
                  {/* ── Name row ── */}
                  <div className="flex items-start gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            ref={editNameRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={handleNameKey}
                            onBlur={submitName}
                            className="flex-1 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-2 py-1 text-sm font-semibold text-[var(--t-text)] focus:outline-none focus:border-cyan-500 font-mono"
                          />
                          <button onMouseDown={(e) => { e.preventDefault(); submitName(); }} className="text-emerald-500 hover:text-emerald-400">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onMouseDown={(e) => { e.preventDefault(); cancelName(); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-semibold text-[var(--t-head)] text-base leading-tight truncate">
                            {roadmap.name}
                          </h2>
                          <button
                            onClick={() => startEditName(roadmap)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-all shrink-0"
                            title="Renombrar"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions (right side) */}
                    {!isEditingName && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-red-400">¿Eliminar?</span>
                            <button
                              onClick={() => confirmDelete(roadmap.id)}
                              className="text-xs font-mono text-red-400 hover:text-red-300 font-semibold transition-colors"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { setDeletingId(roadmap.id); setEditingDescId(null); setEditingId(null); }}
                              className="opacity-0 group-hover:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all"
                              title="Eliminar roadmap"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Button
                              onClick={() => onOpen(roadmap)}
                              size="sm"
                              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 gap-1"
                            >
                              ABRIR <ChevronRight className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Description row ── */}
                  {isEditingDesc ? (
                    <div className="mb-3">
                      <textarea
                        ref={editDescRef}
                        value={editingDesc}
                        onChange={(e) => setEditingDesc(e.target.value)}
                        onKeyDown={handleDescKey}
                        onBlur={submitDesc}
                        rows={2}
                        placeholder="Descripción del roadmap..."
                        className="w-full bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-2 py-1.5 text-xs text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500 font-mono resize-none"
                      />
                      <p className="text-[10px] text-[var(--t-mute3)] font-mono mt-0.5">
                        Enter para guardar · Shift+Enter para nueva línea · Esc para cancelar
                      </p>
                    </div>
                  ) : (
                    <div
                      className="mb-3 cursor-text group/desc"
                      onClick={() => startEditDesc(roadmap)}
                      title="Editar descripción"
                    >
                      {roadmap.description ? (
                        <p className="text-xs text-[var(--t-mute)] leading-relaxed group-hover/desc:text-[var(--t-text)] transition-colors">
                          {roadmap.description}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--t-mute3)] italic opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                          + agregar descripción
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Stats ── */}
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
                </CardContent>
              </Card>
            );
          })}

          {/* Create card */}
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
                  <button onClick={cancelCreate} className="text-[var(--t-mute)] hover:text-[var(--t-text)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full border border-dashed border-[var(--t-bord)] rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:bg-[var(--t-surf)] transition-all"
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
