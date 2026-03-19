'use client';

import { useState, KeyboardEvent } from 'react';
import {
  Roadmap, CompletedDay, Sprint, Phase, SessionModule, StudyCategory,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronRight, ChevronLeft, Plus, Trash2, SlidersHorizontal, X, Check,
} from 'lucide-react';

interface RoadmapOverviewProps {
  roadmap: Roadmap;
  completedDays: CompletedDay[];
  onSelectSprint: (sprint: Sprint) => void;
  onUpdate: (roadmap: Roadmap) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const categoryDot: Record<StudyCategory, string> = {
  technique: 'bg-cyan-500',
  jazz: 'bg-emerald-500',
  reading: 'bg-orange-500',
  theory: 'bg-violet-500',
  'ear-training': 'bg-pink-500',
  custom: 'bg-slate-400',
};

const categoryLabel: Record<StudyCategory, string> = {
  technique: 'Técnica',
  jazz: 'Jazz',
  reading: 'Lectura',
  theory: 'Teoría',
  'ear-training': 'Oído',
  custom: 'Otro',
};

const ALL_CATEGORIES = Object.keys(categoryLabel) as StudyCategory[];

// ─── Small shared input styles ────────────────────────────────────────────────

const inputCls =
  'bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-2 py-1.5 text-sm text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500 font-mono';

const selectCls =
  'bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-2 py-1.5 text-sm text-[var(--t-text)] focus:outline-none focus:border-cyan-500 font-mono cursor-pointer';

// ─── Component ───────────────────────────────────────────────────────────────

export function RoadmapOverview({
  roadmap, completedDays, onSelectSprint, onUpdate,
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

  // ── Module editor (keyed by sprintId) ──
  const [expandedSprintId, setExpandedSprintId] = useState<string | null>(null);
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleCategory, setNewModuleCategory] = useState<StudyCategory>('technique');
  const [newModuleMinutes, setNewModuleMinutes] = useState(15);
  const [newModuleDesc, setNewModuleDesc] = useState('');

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
    if (expandedSprintId === sprintId) setExpandedSprintId(null);
  };

  const toggleModuleEditor = (sprintId: string) => {
    if (expandedSprintId === sprintId) {
      setExpandedSprintId(null);
      setAddingModule(false);
    } else {
      setExpandedSprintId(sprintId);
      setAddingModule(false);
    }
  };

  const addModule = (phaseId: string, sprintId: string) => {
    if (!newModuleName.trim()) return;
    const module: SessionModule = {
      id: crypto.randomUUID(),
      name: newModuleName.trim(),
      category: newModuleCategory,
      defaultMinutes: newModuleMinutes,
      description: newModuleDesc.trim() || undefined,
      color: newModuleCategory,
    };
    onUpdate({
      ...roadmap,
      phases: roadmap.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              sprints: p.sprints.map((s) =>
                s.id === sprintId
                  ? { ...s, session: { ...s.session, modules: [...s.session.modules, module] } }
                  : s
              ),
            }
          : p
      ),
    });
    setNewModuleName('');
    setNewModuleCategory('technique');
    setNewModuleMinutes(15);
    setNewModuleDesc('');
    setAddingModule(false);
  };

  const deleteModule = (phaseId: string, sprintId: string, moduleId: string) => {
    onUpdate({
      ...roadmap,
      phases: roadmap.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              sprints: p.sprints.map((s) =>
                s.id === sprintId
                  ? {
                      ...s,
                      session: {
                        ...s.session,
                        modules: s.session.modules.filter((m) => m.id !== moduleId),
                      },
                    }
                  : s
              ),
            }
          : p
      ),
    });
  };

  const onKey = (e: KeyboardEvent, action: () => void, cancel: () => void) => {
    if (e.key === 'Enter') action();
    if (e.key === 'Escape') cancel();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] p-4 md:p-8 pb-16">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 pt-2">
          <div className="text-xs font-mono text-[var(--t-mute2)] tracking-widest uppercase mb-2">
            Piano Roadmap Architect
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
              Tiempo
            </span>
            <span className="text-sm font-mono font-bold text-cyan-500">
              {totalHours}h {remMinutes}m
            </span>
          </div>
          <span className="text-[var(--t-bord)] font-mono">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[var(--t-mute2)] uppercase tracking-widest">
              Días
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
            expandedSprintId={expandedSprintId}
            addingSprintToPhase={addingSprintToPhase}
            addingModule={addingModule}
            newSprintName={newSprintName}
            newSprintDayStart={newSprintDayStart}
            newSprintDayEnd={newSprintDayEnd}
            newModuleName={newModuleName}
            newModuleCategory={newModuleCategory}
            newModuleMinutes={newModuleMinutes}
            newModuleDesc={newModuleDesc}
            onSelectSprint={onSelectSprint}
            onDeletePhase={() => deletePhase(phase.id)}
            onOpenSprintForm={() => openSprintForm(phase)}
            onCancelSprintForm={() => setAddingSprintToPhase(null)}
            onAddSprint={() => addSprint(phase.id)}
            onDeleteSprint={(sprintId) => deleteSprint(phase.id, sprintId)}
            onToggleModuleEditor={toggleModuleEditor}
            onSetAddingModule={setAddingModule}
            onAddModule={(sprintId) => addModule(phase.id, sprintId)}
            onDeleteModule={(sprintId, moduleId) => deleteModule(phase.id, sprintId, moduleId)}
            onKey={onKey}
            setNewSprintName={setNewSprintName}
            setNewSprintDayStart={setNewSprintDayStart}
            setNewSprintDayEnd={setNewSprintDayEnd}
            setNewModuleName={setNewModuleName}
            setNewModuleCategory={setNewModuleCategory}
            setNewModuleMinutes={setNewModuleMinutes}
            setNewModuleDesc={setNewModuleDesc}
          />
        ))}

        {/* Empty state */}
        {roadmap.phases.length === 0 && !addingPhase && (
          <div className="text-center py-12 text-[var(--t-mute2)] text-sm font-mono">
            Este roadmap no tiene fases aún.
          </div>
        )}

        {/* Add Phase */}
        <div className="mt-4">
          {addingPhase ? (
            <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)]">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest">
                  Nueva Fase
                </p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    placeholder="Nombre de la fase..."
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
                    <span className="text-xs text-[var(--t-mute2)] font-mono">días</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setAddingPhase(false)}
                    className="text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-colors px-2"
                  >
                    Cancelar
                  </button>
                  <Button
                    onClick={addPhase}
                    disabled={!newPhaseName.trim()}
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 disabled:opacity-40"
                  >
                    AGREGAR FASE
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
              Agregar Fase
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── PhaseSection ─────────────────────────────────────────────────────────────

interface PhaseSectionProps {
  phase: Phase;
  completedDays: CompletedDay[];
  expandedSprintId: string | null;
  addingSprintToPhase: string | null;
  addingModule: boolean;
  newSprintName: string;
  newSprintDayStart: number;
  newSprintDayEnd: number;
  newModuleName: string;
  newModuleCategory: StudyCategory;
  newModuleMinutes: number;
  newModuleDesc: string;
  onSelectSprint: (sprint: Sprint) => void;
  onDeletePhase: () => void;
  onOpenSprintForm: () => void;
  onCancelSprintForm: () => void;
  onAddSprint: () => void;
  onDeleteSprint: (sprintId: string) => void;
  onToggleModuleEditor: (sprintId: string) => void;
  onSetAddingModule: (v: boolean) => void;
  onAddModule: (sprintId: string) => void;
  onDeleteModule: (sprintId: string, moduleId: string) => void;
  onKey: (e: KeyboardEvent, action: () => void, cancel: () => void) => void;
  setNewSprintName: (v: string) => void;
  setNewSprintDayStart: (v: number) => void;
  setNewSprintDayEnd: (v: number) => void;
  setNewModuleName: (v: string) => void;
  setNewModuleCategory: (v: StudyCategory) => void;
  setNewModuleMinutes: (v: number) => void;
  setNewModuleDesc: (v: string) => void;
}

function PhaseSection({
  phase, completedDays, expandedSprintId, addingSprintToPhase, addingModule,
  newSprintName, newSprintDayStart, newSprintDayEnd,
  newModuleName, newModuleCategory, newModuleMinutes, newModuleDesc,
  onSelectSprint, onDeletePhase, onOpenSprintForm, onCancelSprintForm, onAddSprint,
  onDeleteSprint, onToggleModuleEditor, onSetAddingModule, onAddModule, onDeleteModule,
  onKey, setNewSprintName, setNewSprintDayStart, setNewSprintDayEnd,
  setNewModuleName, setNewModuleCategory, setNewModuleMinutes, setNewModuleDesc,
}: PhaseSectionProps) {
  const isAddingSprintHere = addingSprintToPhase === phase.id;

  return (
    <div className="mb-8 group/phase">
      {/* Phase header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-[var(--t-head)]">{phase.name}</h2>
        <Badge
          variant="outline"
          className="text-xs font-mono text-[var(--t-mute)] border-[var(--t-bord)]"
        >
          {phase.activeDays} días activos
        </Badge>
        <button
          onClick={onDeletePhase}
          className="ml-auto opacity-0 group-hover/phase:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all"
          title="Eliminar fase"
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
          const isExpanded = expandedSprintId === sprint.id;

          return (
            <Card
              key={sprint.id}
              className="bg-[var(--t-surf)] border-[var(--t-bord2)] hover:border-[var(--t-bord)] transition-colors group/sprint"
            >
              <CardContent className="p-4">
                {/* Sprint top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--t-head)] text-sm mb-1">
                      {sprint.name}
                    </h3>
                    <div className="flex gap-1 flex-wrap">
                      {sprint.session.modules.map((m) => (
                        <div
                          key={m.id}
                          className={`h-1.5 w-6 rounded-full ${categoryDot[m.category]}`}
                        />
                      ))}
                      {sprint.session.modules.length === 0 && (
                        <span className="text-xs font-mono text-[var(--t-mute3)]">
                          Sin módulos
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Module editor toggle */}
                    <button
                      onClick={() => onToggleModuleEditor(sprint.id)}
                      className={`h-7 w-7 flex items-center justify-center rounded-md border transition-colors ${
                        isExpanded
                          ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10'
                          : 'border-[var(--t-bord)] text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:border-[var(--t-bord)] bg-[var(--t-surf2)]'
                      }`}
                      title="Editar módulos"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {sprint.session.modules.length > 0 && (
                      <Button
                        onClick={() => onSelectSprint(sprint)}
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 gap-1"
                      >
                        PRACTICAR <ChevronRight className="w-3 h-3" />
                      </Button>
                    )}

                    <button
                      onClick={() => onDeleteSprint(sprint.id)}
                      className="opacity-0 group-hover/sprint:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all ml-1"
                      title="Eliminar sprint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-2">
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

                {/* Module names summary */}
                {sprint.session.modules.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {sprint.session.modules.map((m) => (
                      <span key={m.id} className="text-xs font-mono text-[var(--t-mute2)]">
                        {m.name}:{' '}
                        <span className="text-[var(--t-mute)]">{m.defaultMinutes}m</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Module editor panel */}
                {isExpanded && (
                  <ModuleEditor
                    phase={phase}
                    sprint={sprint}
                    addingModule={addingModule}
                    newModuleName={newModuleName}
                    newModuleCategory={newModuleCategory}
                    newModuleMinutes={newModuleMinutes}
                    newModuleDesc={newModuleDesc}
                    onSetAddingModule={onSetAddingModule}
                    onAddModule={onAddModule}
                    onDeleteModule={onDeleteModule}
                    onKey={onKey}
                    setNewModuleName={setNewModuleName}
                    setNewModuleCategory={setNewModuleCategory}
                    setNewModuleMinutes={setNewModuleMinutes}
                    setNewModuleDesc={setNewModuleDesc}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Add sprint form */}
        {isAddingSprintHere && (
          <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)]">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest">
                Nuevo Sprint
              </p>
              <input
                autoFocus
                placeholder="Nombre del sprint..."
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                onKeyDown={(e) => onKey(e, onAddSprint, onCancelSprintForm)}
                className={`w-full ${inputCls}`}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--t-mute2)] font-mono">Días</span>
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
                  Cancelar
                </button>
                <Button
                  onClick={onAddSprint}
                  disabled={!newSprintName.trim()}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 disabled:opacity-40"
                >
                  AGREGAR SPRINT
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
            Agregar Sprint
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ModuleEditor ─────────────────────────────────────────────────────────────

interface ModuleEditorProps {
  phase: Phase;
  sprint: Sprint;
  addingModule: boolean;
  newModuleName: string;
  newModuleCategory: StudyCategory;
  newModuleMinutes: number;
  newModuleDesc: string;
  onSetAddingModule: (v: boolean) => void;
  onAddModule: (sprintId: string) => void;
  onDeleteModule: (sprintId: string, moduleId: string) => void;
  onKey: (e: KeyboardEvent, action: () => void, cancel: () => void) => void;
  setNewModuleName: (v: string) => void;
  setNewModuleCategory: (v: StudyCategory) => void;
  setNewModuleMinutes: (v: number) => void;
  setNewModuleDesc: (v: string) => void;
}

function ModuleEditor({
  sprint, addingModule, newModuleName, newModuleCategory, newModuleMinutes, newModuleDesc,
  onSetAddingModule, onAddModule, onDeleteModule, onKey,
  setNewModuleName, setNewModuleCategory, setNewModuleMinutes, setNewModuleDesc,
}: ModuleEditorProps) {
  return (
    <div className="mt-4 pt-4 border-t border-[var(--t-bord2)]">
      <p className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest mb-3">
        Módulos de la sesión
      </p>

      {/* Existing modules */}
      <div className="space-y-2 mb-3">
        {sprint.session.modules.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 group/mod"
          >
            <div className={`h-2 w-2 rounded-full shrink-0 ${categoryDot[m.category]}`} />
            <span className="text-sm text-[var(--t-text)] flex-1">{m.name}</span>
            <span className="text-xs font-mono text-[var(--t-mute2)]">
              {categoryLabel[m.category]}
            </span>
            <span className="text-xs font-mono text-[var(--t-mute)] w-10 text-right">
              {m.defaultMinutes}m
            </span>
            <button
              onClick={() => onDeleteModule(sprint.id, m.id)}
              className="opacity-0 group-hover/mod:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {sprint.session.modules.length === 0 && (
          <p className="text-xs text-[var(--t-mute3)] font-mono">
            Ningún módulo todavía.
          </p>
        )}
      </div>

      {/* Add module form */}
      {addingModule ? (
        <div className="space-y-2 pt-2 border-t border-[var(--t-bord2)]">
          <div className="flex gap-2 flex-wrap">
            <input
              autoFocus
              placeholder="Nombre del módulo..."
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              onKeyDown={(e) =>
                onKey(e, () => onAddModule(sprint.id), () => onSetAddingModule(false))
              }
              className={`flex-1 min-w-0 ${inputCls}`}
            />
            <select
              value={newModuleCategory}
              onChange={(e) => setNewModuleCategory(e.target.value as StudyCategory)}
              className={selectCls}
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabel[cat]}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={180}
                value={newModuleMinutes}
                onChange={(e) => setNewModuleMinutes(Number(e.target.value))}
                className={`w-14 text-center ${inputCls}`}
              />
              <span className="text-xs text-[var(--t-mute2)] font-mono">min</span>
            </div>
          </div>
          <input
            placeholder="Descripción (opcional)..."
            value={newModuleDesc}
            onChange={(e) => setNewModuleDesc(e.target.value)}
            className={`w-full ${inputCls}`}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onSetAddingModule(false)}
              className="text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-colors px-2"
            >
              Cancelar
            </button>
            <Button
              onClick={() => onAddModule(sprint.id)}
              disabled={!newModuleName.trim()}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono text-xs h-8 disabled:opacity-40"
            >
              <Check className="w-3 h-3 mr-1" /> AGREGAR
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onSetAddingModule(true)}
          className="flex items-center gap-1.5 text-xs font-mono text-[var(--t-mute2)] hover:text-cyan-500 transition-colors mt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar módulo
        </button>
      )}
    </div>
  );
}

// ─── MiniCalendar ─────────────────────────────────────────────────────────────

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
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
            <span className="text-[10px] font-mono text-[var(--t-mute2)]">Hoy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-emerald-500 block" />
            </div>
            <span className="text-[10px] font-mono text-[var(--t-mute2)]">Sesión completada</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
