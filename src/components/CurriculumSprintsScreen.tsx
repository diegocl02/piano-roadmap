'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { CurriculumSprint } from '@/types';
import { useLibrary } from '@/hooks/useLibrary';
import {
  ChevronRight, Plus, Pencil, Check, X, Trash2, CheckSquare, Square, Search, Link, FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Lib = ReturnType<typeof useLibrary>;
type EnrichedItem = Lib['allItems'][number];

// ── Item Picker Overlay ───────────────────────────────────────────────────────

function ItemPicker({
  lib,
  sprintId,
  assignedItemIds,
  onClose,
}: {
  lib: Lib;
  sprintId: string;
  assignedItemIds: Set<string>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = lib.allItems.filter(
    (i) =>
      !assignedItemIds.has(i.id) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.topicName.toLowerCase().includes(search.toLowerCase()) ||
        i.areaName.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by area
  const grouped: Record<string, { areaName: string; items: EnrichedItem[] }> = {};
  for (const item of filtered) {
    if (!grouped[item.areaName]) grouped[item.areaName] = { areaName: item.areaName, items: [] };
    grouped[item.areaName].items.push(item);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--t-surf)] border border-[var(--t-bord)] rounded-xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-[var(--t-bord2)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono font-semibold text-sm text-[var(--t-head)]">Add Items to Sprint</h3>
            <button onClick={onClose} className="text-[var(--t-mute)] hover:text-[var(--t-text)]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--t-mute2)]" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md pl-8 pr-3 py-1.5 text-sm font-mono text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {Object.values(grouped).map(({ areaName, items }) => (
            <div key={areaName} className="mb-3">
              <div className="text-[10px] font-mono text-[var(--t-mute2)] uppercase tracking-widest px-2 py-1">
                {areaName}
              </div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { lib.addItemToSprint(sprintId, item.id); }}
                  className="w-full flex items-start gap-2 px-2 py-1.5 rounded hover:bg-[var(--t-surf2)] transition-colors text-left group"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--t-mute2)] group-hover:text-cyan-400 mt-0.5 shrink-0 transition-colors" />
                  <div>
                    <div className="text-xs text-[var(--t-text)]">{item.name}</div>
                    <div className="text-[10px] text-[var(--t-mute2)] font-mono">{item.topicName}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-xs font-mono text-[var(--t-mute3)]">
              {lib.allItems.length === 0
                ? 'No library items yet.'
                : assignedItemIds.size === lib.allItems.length
                ? 'All items are already in this sprint.'
                : 'No se encontraron resultados.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sprint Detail ─────────────────────────────────────────────────────────────

function SprintDetail({
  sprint,
  lib,
  onBack,
}: {
  sprint: CurriculumSprint;
  lib: Lib;
  onBack: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const submitRename = () => {
    if (editName.trim()) lib.renameSprint(sprint.id, editName.trim());
    setEditing(false);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') setEditing(false);
  };

  const assignedItemIds = new Set(sprint.sprintItems.map((si) => si.itemId));
  const completed = sprint.sprintItems.filter((si) => si.completed).length;
  const total = sprint.sprintItems.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Build item lookup
  const itemMap = new Map<string, EnrichedItem>();
  for (const i of lib.allItems) itemMap.set(i.id, i);

  const sortedSprintItems = [...sprint.sprintItems].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-colors mb-6 flex items-center gap-1"
        >
          ← Sprints
        </button>

        {/* Header */}
        <div className="mb-6">
          {editing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKey}
                onBlur={submitRename}
                className="flex-1 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-3 py-1.5 text-2xl font-bold text-[var(--t-head)] focus:outline-none focus:border-cyan-500"
              />
              <button onMouseDown={(e) => { e.preventDefault(); submitRename(); }} className="text-emerald-500 hover:text-emerald-400"><Check className="w-5 h-5" /></button>
              <button onMouseDown={(e) => { e.preventDefault(); setEditing(false); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]"><X className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2 group">
              <h1 className="text-2xl font-bold text-[var(--t-head)]">{sprint.name}</h1>
              <button
                onClick={() => { setEditName(sprint.name); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Progress */}
          {total > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--t-mute2)]">
                <span>{completed} / {total} completed</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-[var(--t-surf2)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sprint items */}
        <div className="space-y-2 mb-4">
          {sortedSprintItems.map((si) => {
            const item = itemMap.get(si.itemId);
            const isExpanded = expandedItemId === si.id;
            return (
              <div key={si.id}>
                <Card className={`bg-[var(--t-surf)] border-[var(--t-bord2)] transition-colors ${si.completed ? 'opacity-60' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 group">
                      <button
                        onClick={() => lib.toggleSprintItem(si.id)}
                        className="mt-0.5 shrink-0 text-[var(--t-mute2)] hover:text-cyan-400 transition-colors"
                      >
                        {si.completed
                          ? <CheckSquare className="w-4 h-4 text-cyan-500" />
                          : <Square className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        {item ? (
                          <>
                            <div className={`text-sm font-medium ${si.completed ? 'line-through text-[var(--t-mute2)]' : 'text-[var(--t-text)]'}`}>
                              {item.name}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--t-mute2)] mt-0.5">
                              {item.areaName} › {item.topicName}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--t-mute2)] italic font-mono">deleted item</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {item && (item.notes || item.resources.length > 0) && (
                          <button
                            onClick={() => setExpandedItemId(isExpanded ? null : si.id)}
                            className="text-[var(--t-mute2)] hover:text-[var(--t-text)] p-0.5"
                            title="Ver detalles"
                          >
                            {isExpanded ? <ChevronRight className="w-3.5 h-3.5 rotate-90" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => lib.removeItemFromSprint(si.id)}
                          className="text-[var(--t-mute2)] hover:text-red-400 p-0.5"
                          title="Quitar del sprint"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && item && (
                      <div className="mt-2 pt-2 border-t border-[var(--t-bord2)] ml-6 space-y-2">
                        {item.notes && (
                          <div>
                            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--t-mute2)] uppercase tracking-widest mb-1">
                              <FileText className="w-2.5 h-2.5" /> Notas
                            </div>
                            <p className="text-xs text-[var(--t-mute)] whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                          </div>
                        )}
                        {item.resources.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--t-mute2)] uppercase tracking-widest mb-1">
                              <Link className="w-2.5 h-2.5" /> Resources
                            </div>
                            <div className="space-y-0.5">
                              {item.resources.map((r) => (
                                <a
                                  key={r.id}
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                  <Link className="w-3 h-3 shrink-0" />
                                  {r.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {total === 0 && (
            <div className="text-center py-8 text-xs font-mono text-[var(--t-mute3)]">
              This sprint has no items yet.
            </div>
          )}
        </div>

        <Button
          onClick={() => setShowPicker(true)}
          size="sm"
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Items
        </Button>
      </div>

      {showPicker && (
        <ItemPicker
          lib={lib}
          sprintId={sprint.id}
          assignedItemIds={assignedItemIds}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ── Sprint List ───────────────────────────────────────────────────────────────

export function CurriculumSprintsScreen({ lib }: { lib: Lib }) {
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const createRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (creating && createRef.current) createRef.current.focus(); }, [creating]);

  const selectedSprint = lib.state.sprints.find((s) => s.id === selectedSprintId) ?? null;

  if (selectedSprint) {
    return (
      <SprintDetail
        sprint={selectedSprint}
        lib={lib}
        onBack={() => setSelectedSprintId(null)}
      />
    );
  }

  const submitCreate = () => {
    if (newName.trim()) lib.createSprint(newName.trim());
    setCreating(false); setNewName('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitCreate();
    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
  };

  if (!lib.hydrated) {
    return (
      <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
        <div className="font-mono text-cyan-400 text-sm animate-pulse tracking-widest">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 pt-2">
          <div className="text-xs font-mono text-[var(--t-mute2)] tracking-widest uppercase mb-2">
            Piano Roadmap
          </div>
          <h1 className="text-3xl font-bold text-[var(--t-head)]">Sprints</h1>
          <p className="text-[var(--t-mute)] text-sm mt-1">
            Study periods with library items assigned.
          </p>
        </div>

        <div className="space-y-3 mb-4">
          {lib.state.sprints.map((sprint) => {
            const completed = sprint.sprintItems.filter((si) => si.completed).length;
            const total = sprint.sprintItems.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isDeleting = deletingId === sprint.id;

            return (
              <Card
                key={sprint.id}
                className="bg-[var(--t-surf)] border-[var(--t-bord2)] hover:border-[var(--t-bord)] transition-colors group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-[var(--t-head)] text-base">{sprint.name}</h2>
                      <div className="text-xs font-mono text-[var(--t-mute2)] mt-0.5">
                        {total} {total === 1 ? 'item' : 'items'}
                        {total > 0 && ` · ${completed} completed`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDeleting ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-red-400">Delete?</span>
                          <button onClick={() => { lib.deleteSprint(sprint.id); setDeletingId(null); }} className="text-xs font-mono text-red-400 hover:text-red-300 font-semibold">Sí</button>
                          <button onClick={() => setDeletingId(null)} className="text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)]">No</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setDeletingId(sprint.id)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Button
                            onClick={() => setSelectedSprintId(sprint.id)}
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 gap-1"
                          >
                            ABRIR <ChevronRight className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {total > 0 && (
                    <div className="space-y-1">
                      <div className="h-1 bg-[var(--t-surf2)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {creating ? (
            <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={createRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Nombre del sprint..."
                    className="flex-1 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-3 py-1.5 text-sm font-mono text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500"
                  />
                  <Button onClick={submitCreate} size="sm" disabled={!newName.trim()} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 disabled:opacity-40">
                    CREAR
                  </Button>
                  <button onClick={() => { setCreating(false); setNewName(''); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]">
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
              <Plus className="w-4 h-4" /> New Sprint
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
