'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Roadmap, CompletedDay, Sprint, Phase, SessionModule, StudyCategory,
  RoadmapSprintItem, CurriculumItem,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronRight, ChevronLeft, Plus, Trash2, X,
  CheckSquare, Square, BookOpen, Search, Link,
} from 'lucide-react';

type EnrichedItem = CurriculumItem & { topicName: string; areaName: string };

interface RoadmapOverviewProps {
  roadmap: Roadmap;
  completedDays: CompletedDay[];
  onSelectSprint: (sprint: Sprint) => void;
  onUpdate: (roadmap: Roadmap) => void;
  allLibItems: EnrichedItem[];
  roadmapSprintItems: RoadmapSprintItem[];
  onAddSprintItem: (sprintId: string, roadmapId: string, itemId: string) => void;
  onRemoveSprintItem: (id: string) => void;
  onToggleSprintItem: (id: string) => void;
  onUpdateSprintItemMinutes: (id: string, minutes: number) => void;
}

// ─── Small shared input styles ────────────────────────────────────────────────

const inputCls =
  'bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-2 py-1.5 text-sm text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500 font-mono';

// ─── Component ───────────────────────────────────────────────────────────────

export function RoadmapOverview({
  roadmap, completedDays, onSelectSprint, onUpdate,
  allLibItems, roadmapSprintItems, onAddSprintItem, onRemoveSprintItem,
  onToggleSprintItem, onUpdateSprintItemMinutes,
}: RoadmapOverviewProps) {
  const totalMinutes = completedDays.reduce((sum, d) => sum + d.totalMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;

  // ── Phase form ──
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseActiveDays, setNewPhaseActiveDays] = useState(30);

  // ── Sprint form (keyed by phaseId) ──
  const [addingSprintToPhase, setAddingSprintToPhase] = useState<string | null>(null);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintDayStart, setNewSprintDayStart] = useState(1);
  const [newSprintDayEnd, setNewSprintDayEnd] = useState(22);

  // ── Library items panel (keyed by sprintId) ──
  const [expandedLibSprintId, setExpandedLibSprintId] = useState<string | null>(null);
  const [pickerSprintId, setPickerSprintId] = useState<string | null>(null);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addPhase = () => {
    if (!newPhaseName.trim()) return;
    const phase: Phase = {
      id: crypto.randomUUID(),
      name: newPhaseName.trim(),
      activeDays: newPhaseActiveDays,
      sprints: [],
    };
    onUpdate({ ...roadmap, phases: [...roadmap.phases, phase] });
    setNewPhaseName('');
    setNewPhaseActiveDays(30);
    setAddingPhase(false);
  };

  const deletePhase = (phaseId: string) => {
    onUpdate({ ...roadmap, phases: roadmap.phases.filter((p) => p.id !== phaseId) });
  };

  const openSprintForm = (phase: Phase) => {
    const lastSprint = phase.sprints[phase.sprints.length - 1];
    const dayStart = lastSprint ? lastSprint.dayEnd + 1 : 1;
    setNewSprintDayStart(dayStart);
    setNewSprintDayEnd(dayStart + 21);
    setNewSprintName('');
    setAddingSprintToPhase(phase.id);
  };

  const addSprint = (phaseId: string) => {
    if (!newSprintName.trim()) return;
    const sprint: Sprint = {
      id: crypto.randomUUID(),
      name: newSprintName.trim(),
      dayStart: newSprintDayStart,
      dayEnd: newSprintDayEnd,
      session: { id: crypto.randomUUID(), modules: [] },
    };
    onUpdate({
      ...roadmap,
      phases: roadmap.phases.map((p) =>
        p.id === phaseId ? { ...p, sprints: [...p.sprints, sprint] } : p
      ),
    });
    setAddingSprintToPhase(null);
    setNewSprintName('');
  };

  const deleteSprint = (phaseId: string, sprintId: string) => {
    onUpdate({
      ...roadmap,
      phases: roadmap.phases.map((p) =>
        p.id === phaseId ? { ...p, sprints: p.sprints.filter((s) => s.id !== sprintId) } : p
      ),
    });
  };

  const onKey = (e: KeyboardEvent, action: () => void, cancel: () => void) => {
    if (e.key === 'Enter') action();
    if (e.key === 'Escape') cancel();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] p-4 md:p-8 pb-16">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 pt-2">
          <div className="text-xs font-mono text-[var(--t-mute2)] tracking-widest uppercase mb-2">
            Piano Roadmap
          </div>
          <h1 className="text-3xl font-bold text-[var(--t-head)] mb-1">{roadmap.name}</h1>
          {roadmap.description && (
            <p className="text-[var(--t-mute)] text-sm">{roadmap.description}</p>
          )}
        </div>

        {/* Compact stats + Calendar */}
        <div className="flex items-center gap-4 mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[var(--t-mute2)] uppercase tracking-widest">
              Time
            </span>
            <span className="text-sm font-mono font-bold text-cyan-500">
              {totalHours}h {remMinutes}m
            </span>
          </div>
          <span className="text-[var(--t-bord)] font-mono">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[var(--t-mute2)] uppercase tracking-widest">
              Days
            </span>
            <span className="text-sm font-mono font-bold text-emerald-500">
              {completedDays.length}
            </span>
          </div>
        </div>

        <MiniCalendar roadmap={roadmap} completedDays={completedDays} />

        <div className="mt-6 mb-2" />

        {/* Phases */}
        {roadmap.phases.map((phase) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            completedDays={completedDays}
            addingSprintToPhase={addingSprintToPhase}
            newSprintName={newSprintName}
            newSprintDayStart={newSprintDayStart}
            newSprintDayEnd={newSprintDayEnd}
            onSelectSprint={onSelectSprint}
            onDeletePhase={() => deletePhase(phase.id)}
            onOpenSprintForm={() => openSprintForm(phase)}
            onCancelSprintForm={() => setAddingSprintToPhase(null)}
            onAddSprint={() => addSprint(phase.id)}
            onDeleteSprint={(sprintId) => deleteSprint(phase.id, sprintId)}
            onKey={onKey}
            setNewSprintName={setNewSprintName}
            setNewSprintDayStart={setNewSprintDayStart}
            setNewSprintDayEnd={setNewSprintDayEnd}
            libraryProps={{
              allLibItems,
              sprintItems: roadmapSprintItems,
              onAddItem: (sprintId, itemId) => onAddSprintItem(sprintId, roadmap.id, itemId),
              onRemoveItem: onRemoveSprintItem,
              onToggleItem: onToggleSprintItem,
              onUpdateMinutes: onUpdateSprintItemMinutes,
              expandedSprintId: expandedLibSprintId,
              onToggleExpand: (id) => setExpandedLibSprintId((prev) => prev === id ? null : id),
              onOpenPicker: setPickerSprintId,
            }}
          />
        ))}

        {/* Empty state */}
        {roadmap.phases.length === 0 && !addingPhase && (
          <div className="text-center py-12 text-[var(--t-mute2)] text-sm font-mono">
            This roadmap has no phases yet.
          </div>
        )}

        {/* Add Phase */}
        <div className="mt-4">
          {addingPhase ? (
            <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)]">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest">
                  New Phase
                </p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    placeholder="Phase name..."
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    onKeyDown={(e) => onKey(e, addPhase, () => setAddingPhase(false))}
                    className={`flex-1 ${inputCls}`}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={1}
                      value={newPhaseActiveDays}
                      onChange={(e) => setNewPhaseActiveDays(Number(e.target.value))}
                      className={`w-16 text-center ${inputCls}`}
                    />
                    <span className="text-xs text-[var(--t-mute2)] font-mono">days</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setAddingPhase(false)}
                    className="text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-colors px-2"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={addPhase}
                    disabled={!newPhaseName.trim()}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 disabled:opacity-40"
                  >
                    ADD PHASE
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => setAddingPhase(true)}
              className="w-full border border-dashed border-[var(--t-bord)] rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:bg-[var(--t-surf)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Phase
            </button>
          )}
        </div>

      </div>
    </div>

    {pickerSprintId && (
      <SprintItemPicker
        allLibItems={allLibItems}
        assignedItemIds={new Set(
          roadmapSprintItems
            .filter((si) => si.sprintId === pickerSprintId)
            .map((si) => si.itemId)
        )}
        onAdd={(itemId) => onAddSprintItem(pickerSprintId, roadmap.id, itemId)}
        onClose={() => setPickerSprintId(null)}
      />
    )}
    </>
  );
}

// ─── SprintItemPicker ─────────────────────────────────────────────────────────

function SprintItemPicker({
  allLibItems, assignedItemIds, onAdd, onClose,
}: {
  allLibItems: EnrichedItem[];
  assignedItemIds: Set<string>;
  onAdd: (itemId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = allLibItems.filter(
    (i) =>
      !assignedItemIds.has(i.id) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.topicName.toLowerCase().includes(search.toLowerCase()) ||
        i.areaName.toLowerCase().includes(search.toLowerCase()))
  );

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
            <h3 className="font-mono font-semibold text-sm text-[var(--t-head)]">Add from Library</h3>
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
                  onClick={() => onAdd(item.id)}
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
              {allLibItems.length === 0
                ? 'No library items yet.'
                : 'No more items available.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Library Items Panel ──────────────────────────────────────────────────────

interface LibraryProps {
  allLibItems: EnrichedItem[];
  sprintItems: RoadmapSprintItem[];
  onAddItem: (sprintId: string, itemId: string) => void;
  onRemoveItem: (id: string) => void;
  onToggleItem: (id: string) => void;
  onUpdateMinutes: (id: string, minutes: number) => void;
  expandedSprintId: string | null;
  onToggleExpand: (sprintId: string) => void;
  onOpenPicker: (sprintId: string) => void;
}

function LibraryItemsSection({ sprint, lib }: { sprint: Sprint; lib: LibraryProps }) {
  const myItems = lib.sprintItems.filter((si) => si.sprintId === sprint.id);
  const completed = myItems.filter((si) => si.completed).length;
  const isOpen = lib.expandedSprintId === sprint.id;
  const itemMap = new Map(lib.allLibItems.map((i) => [i.id, i]));

  return (
    <div className="mt-2 pt-2 border-t border-[var(--t-bord2)]">
      <button
        onClick={() => lib.onToggleExpand(sprint.id)}
        className="flex items-center gap-1.5 text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-colors w-full"
      >
        <BookOpen className="w-3 h-3 shrink-0" />
        <span className="flex-1 text-left">
          {myItems.length === 0
            ? 'No library items'
            : `${myItems.length} ${myItems.length === 1 ? 'item' : 'items'} · ${completed} completed`}
        </span>
        {isOpen ? (
          <ChevronRight className="w-3 h-3 rotate-90 transition-transform" />
        ) : (
          <ChevronRight className="w-3 h-3 transition-transform" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1">
          {myItems.map((si) => {
            const item = itemMap.get(si.itemId);
            return (
              <div key={si.id} className="flex items-center gap-2 group/libitem py-0.5">
                <button
                  onClick={() => lib.onToggleItem(si.id)}
                  className="shrink-0 text-[var(--t-mute2)] hover:text-cyan-400 transition-colors"
                >
                  {si.completed
                    ? <CheckSquare className="w-3.5 h-3.5 text-cyan-500" />
                    : <Square className="w-3.5 h-3.5" />}
                </button>
                <div className={`flex-1 min-w-0 text-xs ${si.completed ? 'line-through text-[var(--t-mute2)]' : 'text-[var(--t-text)]'}`}>
                  {item ? (
                    <>
                      {item.name}
                      <span className="text-[var(--t-mute3)] font-mono ml-1.5 not-italic text-[10px]">
                        {item.areaName} › {item.topicName}
                      </span>
                      {item.resources.length > 0 && (
                        <span className="ml-1 text-[var(--t-mute3)] font-mono text-[10px]">
                          <Link className="w-2.5 h-2.5 inline" />{item.resources.length}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="italic text-[var(--t-mute3)]">deleted item</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={si.defaultMinutes ?? 15}
                    onChange={(e) => lib.onUpdateMinutes(si.id, Number(e.target.value))}
                    className="w-10 text-center text-xs font-mono bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded px-1 py-0.5 text-[var(--t-text)] focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] font-mono text-[var(--t-mute3)]">m</span>
                </div>
                <button
                  onClick={() => lib.onRemoveItem(si.id)}
                  className="opacity-0 group-hover/libitem:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => lib.onOpenPicker(sprint.id)}
            className="flex items-center gap-1 text-xs font-mono text-[var(--t-mute2)] hover:text-cyan-400 transition-colors mt-1"
          >
            <Plus className="w-3 h-3" /> Add from library
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PhaseSection ─────────────────────────────────────────────────────────────

interface PhaseSectionProps {
  phase: Phase;
  completedDays: CompletedDay[];
  addingSprintToPhase: string | null;
  newSprintName: string;
  newSprintDayStart: number;
  newSprintDayEnd: number;
  onSelectSprint: (sprint: Sprint) => void;
  onDeletePhase: () => void;
  onOpenSprintForm: () => void;
  onCancelSprintForm: () => void;
  onAddSprint: () => void;
  onDeleteSprint: (sprintId: string) => void;
  onKey: (e: KeyboardEvent, action: () => void, cancel: () => void) => void;
  setNewSprintName: (v: string) => void;
  setNewSprintDayStart: (v: number) => void;
  setNewSprintDayEnd: (v: number) => void;
  libraryProps: LibraryProps;
}

function PhaseSection({
  phase, completedDays, addingSprintToPhase,
  newSprintName, newSprintDayStart, newSprintDayEnd,
  onSelectSprint, onDeletePhase, onOpenSprintForm, onCancelSprintForm, onAddSprint,
  onDeleteSprint, onKey, setNewSprintName, setNewSprintDayStart, setNewSprintDayEnd,
  libraryProps,
}: PhaseSectionProps) {
  const isAddingSprintHere = addingSprintToPhase === phase.id;
  const itemMap = new Map(libraryProps.allLibItems.map((i) => [i.id, i]));

  return (
    <div className="mb-8 group/phase">
      {/* Phase header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-[var(--t-head)]">{phase.name}</h2>
        <Badge
          variant="outline"
          className="text-xs font-mono text-[var(--t-mute)] border-[var(--t-bord)]"
        >
          {phase.activeDays} active days
        </Badge>
        <button
          onClick={onDeletePhase}
          className="ml-auto opacity-0 group-hover/phase:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all"
          title="Delete phase"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sprints */}
      <div className="space-y-3">
        {phase.sprints.map((sprint) => {
          const sprintDays = completedDays.filter((d) => d.sprintId === sprint.id);
          const totalSprintDays = sprint.dayEnd - sprint.dayStart + 1;
          const completionPct = Math.min(100, (sprintDays.length / totalSprintDays) * 100);
          const myLibItems = libraryProps.sprintItems.filter((si) => si.sprintId === sprint.id);
          const canPractice = myLibItems.some((si) => si.defaultMinutes > 0);

          const handlePracticar = () => {
            const modules: SessionModule[] = myLibItems
              .filter((si) => si.defaultMinutes > 0)
              .map((si) => {
                const item = itemMap.get(si.itemId);
                return {
                  id: si.id,
                  name: item?.name ?? 'Item',
                  category: 'custom' as StudyCategory,
                  description: item ? `${item.areaName} › ${item.topicName}` : undefined,
                  defaultMinutes: si.defaultMinutes,
                  color: 'custom',
                };
              });
            onSelectSprint({ ...sprint, session: { id: `session-${sprint.id}`, modules } });
          };

          return (
            <Card
              key={sprint.id}
              className="bg-[var(--t-surf)] border-[var(--t-bord2)] hover:border-[var(--t-bord)] transition-colors group/sprint"
            >
              <CardContent className="p-4">
                {/* Sprint top row */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-[var(--t-head)] text-sm flex-1 mr-2">
                    {sprint.name}
                    <span className="ml-2 text-[var(--t-mute3)] font-mono font-normal text-xs">
                      days {sprint.dayStart}–{sprint.dayEnd}
                    </span>
                  </h3>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {canPractice && (
                      <Button
                        onClick={handlePracticar}
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 gap-1"
                      >
                        PRACTICE <ChevronRight className="w-3 h-3" />
                      </Button>
                    )}
                    <button
                      onClick={() => onDeleteSprint(sprint.id)}
                      className="opacity-0 group-hover/sprint:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all"
                      title="Delete sprint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1 bg-[var(--t-surf2)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[var(--t-mute2)]">
                    {sprintDays.length}/{totalSprintDays}
                  </span>
                </div>

                {/* Library items panel */}
                <LibraryItemsSection sprint={sprint} lib={libraryProps} />
              </CardContent>
            </Card>
          );
        })}

        {/* Add sprint form */}
        {isAddingSprintHere && (
          <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)]">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest">
                New Sprint
              </p>
              <input
                autoFocus
                placeholder="Sprint name..."
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                onKeyDown={(e) => onKey(e, onAddSprint, onCancelSprintForm)}
                className={`w-full ${inputCls}`}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--t-mute2)] font-mono">Days</span>
                <input
                  type="number"
                  min={1}
                  value={newSprintDayStart}
                  onChange={(e) => setNewSprintDayStart(Number(e.target.value))}
                  className={`w-16 text-center ${inputCls}`}
                />
                <span className="text-xs text-[var(--t-mute2)] font-mono">—</span>
                <input
                  type="number"
                  min={1}
                  value={newSprintDayEnd}
                  onChange={(e) => setNewSprintDayEnd(Number(e.target.value))}
                  className={`w-16 text-center ${inputCls}`}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onCancelSprintForm}
                  className="text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-colors px-2"
                >
                  Cancel
                </button>
                <Button
                  onClick={onAddSprint}
                  disabled={!newSprintName.trim()}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 disabled:opacity-40"
                >
                  ADD SPRINT
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add sprint button */}
        {!isAddingSprintHere && (
          <button
            onClick={onOpenSprintForm}
            className="w-full border border-dashed border-[var(--t-bord)] rounded-lg p-3 flex items-center justify-center gap-2 text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:bg-[var(--t-surf)] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Sprint
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MiniCalendar ─────────────────────────────────────────────────────────────

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function MiniCalendar({ roadmap, completedDays }: { roadmap: Roadmap; completedDays: CompletedDay[] }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  // Only show sessions belonging to this roadmap
  const completedDates = new Set(
    completedDays
      .filter((d) => d.roadmapId === roadmap.id)
      .map((d) => d.date)
  );

  const todayStr = now.toISOString().split('T')[0];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // ISO week: Mon=0 … Sun=6
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)]">
      <CardContent className="p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:bg-[var(--t-surf2)] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-semibold text-[var(--t-text)] uppercase tracking-widest">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:bg-[var(--t-surf2)] transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-mono text-[var(--t-mute3)] pb-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;

            const mm = String(viewMonth + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            const dateStr = `${viewYear}-${mm}-${dd}`;
            const isToday = dateStr === todayStr;
            const isDone = completedDates.has(dateStr);

            return (
              <div key={i} className="flex flex-col items-center py-0.5">
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-mono relative transition-colors ${
                    isToday
                      ? 'bg-cyan-500 text-slate-900 font-bold'
                      : isDone
                      ? 'bg-emerald-500/15 text-emerald-500 font-semibold'
                      : 'text-[var(--t-mute)]'
                  }`}
                >
                  {day}
                  {/* dot indicator for completed (also shown on today if completed) */}
                  {isDone && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        isToday ? 'bg-slate-900' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--t-bord2)]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-[10px] font-mono text-[var(--t-mute2)]">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-emerald-500 block" />
            </div>
            <span className="text-[10px] font-mono text-[var(--t-mute2)]">Session completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
