'use client';

import { useState, useCallback } from 'react';
import { Sprint, PlannedModule, SessionPlan, StudyCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Clock, Music, BookOpen, Zap } from 'lucide-react';

interface SessionConfiguratorProps {
  sprint: Sprint;
  onStart: (plan: SessionPlan) => void;
}

const categoryIcon: Record<StudyCategory, React.ReactNode> = {
  technique: <Zap className="w-4 h-4" />,
  jazz: <Music className="w-4 h-4" />,
  reading: <BookOpen className="w-4 h-4" />,
  theory: <BookOpen className="w-4 h-4" />,
  'ear-training': <Music className="w-4 h-4" />,
  custom: <Clock className="w-4 h-4" />,
};

// Accent colors stay vibrant in both themes
const categoryAccent: Record<StudyCategory, string> = {
  technique: 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10',
  jazz: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
  reading: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
  theory: 'text-violet-500 border-violet-500/30 bg-violet-500/10',
  'ear-training': 'text-pink-500 border-pink-500/30 bg-pink-500/10',
  custom: 'text-slate-500 border-slate-500/30 bg-slate-500/10',
};

const accentBorder: Record<StudyCategory, string> = {
  technique: 'border-l-cyan-500',
  jazz: 'border-l-emerald-500',
  reading: 'border-l-orange-500',
  theory: 'border-l-violet-500',
  'ear-training': 'border-l-pink-500',
  custom: 'border-l-slate-400',
};

export function SessionConfigurator({ sprint, onStart }: SessionConfiguratorProps) {
  const today = new Date().toISOString().split('T')[0];

  const [modules, setModules] = useState<PlannedModule[]>(
    sprint.session.modules.map((m) => ({
      moduleId: m.id,
      module: m,
      allocatedMinutes: m.defaultMinutes,
      selected: true,
    }))
  );

  const totalMinutes = modules
    .filter((m) => m.selected)
    .reduce((sum, m) => sum + m.allocatedMinutes, 0);

  const toggleModule = useCallback((moduleId: string) => {
    setModules((prev) =>
      prev.map((m) => (m.moduleId === moduleId ? { ...m, selected: !m.selected } : m))
    );
  }, []);

  const updateMinutes = useCallback((moduleId: string, value: string) => {
    const num = Math.max(1, Math.min(180, parseInt(value) || 1));
    setModules((prev) =>
      prev.map((m) => (m.moduleId === moduleId ? { ...m, allocatedMinutes: num } : m))
    );
  }, []);

  const handleStart = useCallback(() => {
    const selectedModules = modules.filter((m) => m.selected);
    if (selectedModules.length === 0) return;

    const plan: SessionPlan = {
      sprintId: sprint.id,
      date: today,
      plannedModules: selectedModules,
      totalMinutes,
    };
    onStart(plan);
  }, [modules, sprint.id, today, totalMinutes, onStart]);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--t-mute2)] mb-2 tracking-widest uppercase">
            <span>Piano Roadmap Architect</span>
            <span>/</span>
            <span className="text-cyan-500">Session Config</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--t-head)]">{sprint.name}</h1>
          <p className="text-[var(--t-mute)] text-sm mt-1 font-mono">
            {today} — Configura tu sesión de práctica
          </p>
        </div>

        {/* Module Cards */}
        <div className="space-y-3 mb-6">
          {modules.map((pm) => {
            const cat = pm.module.category;
            return (
              <Card
                key={pm.moduleId}
                className={`bg-[var(--t-surf)] border border-[var(--t-bord2)] border-l-4 ${accentBorder[cat]} transition-opacity ${
                  !pm.selected ? 'opacity-40' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={pm.moduleId}
                      checked={pm.selected}
                      onCheckedChange={() => toggleModule(pm.moduleId)}
                      className="mt-1 border-[var(--t-bord)] data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />

                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={pm.moduleId}
                        className="flex items-center gap-2 cursor-pointer mb-1"
                      >
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono ${categoryAccent[cat]} gap-1`}
                        >
                          {categoryIcon[cat]}
                          {pm.module.name}
                        </Badge>
                      </label>
                      {pm.module.description && (
                        <p className="text-xs text-[var(--t-mute2)] mt-1 leading-relaxed">
                          {pm.module.description}
                        </p>
                      )}
                    </div>

                    {/* Time Input */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-2 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-3 py-1.5">
                        <Clock className="w-3 h-3 text-[var(--t-mute2)]" />
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={pm.allocatedMinutes}
                          onChange={(e) => updateMinutes(pm.moduleId, e.target.value)}
                          disabled={!pm.selected}
                          className="w-12 bg-transparent text-right font-mono text-sm text-[var(--t-text)] focus:outline-none disabled:text-[var(--t-mute3)]"
                        />
                        <span className="text-xs text-[var(--t-mute2)] font-mono">min</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="bg-[var(--t-bord2)] mb-6" />

        {/* Session Summary */}
        <div className="bg-[var(--t-surf)] border border-[var(--t-bord2)] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest mb-1">
                Duración Total
              </p>
              <p className="text-3xl font-mono font-bold text-[var(--t-head)]">
                {formatTime(totalMinutes)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest mb-1">
                Módulos Activos
              </p>
              <p className="text-3xl font-mono font-bold text-cyan-500">
                {modules.filter((m) => m.selected).length}
                <span className="text-[var(--t-mute3)] text-xl">/{modules.length}</span>
              </p>
            </div>
          </div>

          {/* Mini breakdown */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {modules
              .filter((m) => m.selected)
              .map((pm) => (
                <div
                  key={pm.moduleId}
                  className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full border ${categoryAccent[pm.module.category]}`}
                >
                  {categoryIcon[pm.module.category]}
                  <span>{pm.allocatedMinutes}m</span>
                </div>
              ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={modules.filter((m) => m.selected).length === 0}
          className="w-full h-14 text-base font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl transition-all disabled:opacity-30 gap-3"
        >
          <Play className="w-5 h-5 fill-current" />
          INICIAR SESIÓN
        </Button>
      </div>
    </div>
  );
}
