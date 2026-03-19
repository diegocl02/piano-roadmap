'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SessionPlan, PracticeSession, ActiveModule, SubObjective, StudyCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipForward, CheckCircle2, Plus } from 'lucide-react';

interface PracticeModeProps {
  plan: SessionPlan;
  onComplete: (session: PracticeSession) => void;
  onUpdate: (session: PracticeSession) => void;
}

const categoryColor: Record<StudyCategory, string> = {
  technique: 'text-cyan-500',
  jazz: 'text-emerald-500',
  reading: 'text-orange-500',
  theory: 'text-violet-500',
  'ear-training': 'text-pink-500',
  custom: 'text-slate-500',
};

const categoryBg: Record<StudyCategory, string> = {
  technique: 'bg-cyan-500',
  jazz: 'bg-emerald-500',
  reading: 'bg-orange-500',
  theory: 'bg-violet-500',
  'ear-training': 'bg-pink-500',
  custom: 'bg-slate-400',
};

function buildSession(plan: SessionPlan): PracticeSession {
  return {
    plan,
    currentModuleIndex: 0,
    sessionStatus: 'idle',
    startedAt: new Date().toISOString(),
    modules: plan.plannedModules.map((pm) => ({
      plannedModule: pm,
      subObjectives: [],
      timeElapsed: 0,
      status: 'idle',
    })),
  };
}

export function PracticeMode({ plan, onComplete, onUpdate }: PracticeModeProps) {
  const [session, setSession] = useState<PracticeSession>(() => buildSession(plan));
  const [newObjective, setNewObjective] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentModule: ActiveModule = session.modules[session.currentModuleIndex];
  const totalSeconds = currentModule.plannedModule.allocatedMinutes * 60;
  const timeLeft = Math.max(0, totalSeconds - currentModule.timeElapsed);
  const progress = (currentModule.timeElapsed / totalSeconds) * 100;

  const playAlert = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.8);
    } catch {
      // audio not available
    }
  }, []);

  const updateSession = useCallback(
    (updater: (s: PracticeSession) => PracticeSession) => {
      setSession((prev) => {
        const next = updater(prev);
        onUpdate(next);
        return next;
      });
    },
    [onUpdate]
  );

  useEffect(() => {
    if (session.sessionStatus !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      updateSession((prev) => {
        const modules = [...prev.modules];
        const current = { ...modules[prev.currentModuleIndex] };
        current.timeElapsed += 1;

        const targetSeconds = current.plannedModule.allocatedMinutes * 60;

        if (current.timeElapsed >= targetSeconds) {
          current.status = 'completed';
          modules[prev.currentModuleIndex] = current;
          playAlert();

          const nextIndex = prev.currentModuleIndex + 1;
          if (nextIndex < modules.length) {
            modules[nextIndex] = { ...modules[nextIndex], status: 'running' };
            return { ...prev, modules, currentModuleIndex: nextIndex };
          } else {
            return { ...prev, modules, sessionStatus: 'completed' };
          }
        }

        modules[prev.currentModuleIndex] = current;
        return { ...prev, modules };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session.sessionStatus, session.currentModuleIndex, playAlert, updateSession]);

  const toggleTimer = useCallback(() => {
    updateSession((prev) => ({
      ...prev,
      sessionStatus: prev.sessionStatus === 'running' ? 'paused' : 'running',
    }));
  }, [updateSession]);

  const skipModule = useCallback(() => {
    updateSession((prev) => {
      const nextIndex = prev.currentModuleIndex + 1;
      if (nextIndex >= prev.modules.length) return { ...prev, sessionStatus: 'completed' };
      const modules = [...prev.modules];
      modules[nextIndex] = { ...modules[nextIndex], status: 'running' };
      return { ...prev, currentModuleIndex: nextIndex, modules };
    });
  }, [updateSession]);

  const toggleObjective = useCallback(
    (objId: string) => {
      updateSession((prev) => {
        const modules = [...prev.modules];
        const current = { ...modules[prev.currentModuleIndex] };
        current.subObjectives = current.subObjectives.map((o) =>
          o.id === objId ? { ...o, completed: !o.completed } : o
        );
        modules[prev.currentModuleIndex] = current;
        return { ...prev, modules };
      });
    },
    [updateSession]
  );

  const addObjective = useCallback(() => {
    if (!newObjective.trim()) return;
    const obj: SubObjective = {
      id: crypto.randomUUID(),
      text: newObjective.trim(),
      completed: false,
    };
    updateSession((prev) => {
      const modules = [...prev.modules];
      const current = { ...modules[prev.currentModuleIndex] };
      current.subObjectives = [...current.subObjectives, obj];
      modules[prev.currentModuleIndex] = current;
      return { ...prev, modules };
    });
    setNewObjective('');
  }, [newObjective, updateSession]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (session.sessionStatus === 'completed') {
    return (
      <div className="min-h-screen bg-[var(--t-bg)] flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4" />
        <h2 className="text-3xl font-bold text-[var(--t-head)] mb-2">¡Sesión Completada!</h2>
        <p className="text-[var(--t-mute)] font-mono mb-8">
          {plan.totalMinutes} minutos de práctica
        </p>
        <Button
          onClick={() => onComplete(session)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-8 h-12"
        >
          GUARDAR Y TERMINAR
        </Button>
      </div>
    );
  }

  const cat = currentModule.plannedModule.module.category;

  return (
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress dots */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest">
            Módulo {session.currentModuleIndex + 1} / {session.modules.length}
          </div>
          <div className="flex gap-1">
            {session.modules.map((m, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-all ${
                  m.status === 'completed'
                    ? categoryBg[m.plannedModule.module.category]
                    : i === session.currentModuleIndex
                    ? 'bg-[var(--t-head)]'
                    : 'bg-[var(--t-mid)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Current Module Header */}
        <div className="mb-6">
          <Badge
            variant="outline"
            className={`font-mono text-sm mb-3 ${categoryColor[cat]} border-current/30 bg-current/10`}
          >
            {currentModule.plannedModule.module.name}
          </Badge>
          <p className="text-[var(--t-mute)] text-sm">
            {currentModule.plannedModule.module.description}
          </p>
        </div>

        {/* Timer Display */}
        <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)] mb-6">
          <CardContent className="p-8 text-center">
            <div
              className={`text-7xl font-mono font-bold mb-4 tabular-nums ${
                timeLeft <= 60 ? 'text-orange-500' : categoryColor[cat]
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            <Progress
              value={progress}
              className="h-2 bg-[var(--t-surf2)] mb-6 [&>div]:transition-all"
            />
            <div className="flex justify-center gap-3">
              <Button
                onClick={toggleTimer}
                className={`h-14 w-36 font-mono font-bold text-base gap-2 ${
                  session.sessionStatus === 'running'
                    ? 'bg-[var(--t-mid)] hover:bg-[var(--t-mid-hover)] text-[var(--t-mid-text)]'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                }`}
              >
                {session.sessionStatus === 'running' ? (
                  <>
                    <Pause className="w-5 h-5" /> PAUSA
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" /> INICIAR
                  </>
                )}
              </Button>
              <Button
                onClick={skipModule}
                variant="outline"
                className="h-14 w-14 border-[var(--t-bord)] bg-[var(--t-surf2)] hover:bg-[var(--t-mid)] text-[var(--t-mute)]"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sub-objectives */}
        <Card className="bg-[var(--t-surf)] border-[var(--t-bord2)]">
          <CardContent className="p-4">
            <p className="text-xs font-mono text-[var(--t-mute2)] uppercase tracking-widest mb-3">
              Sub-objetivos
            </p>
            <div className="space-y-2 mb-3">
              {currentModule.subObjectives.map((obj) => (
                <label key={obj.id} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={obj.completed}
                    onCheckedChange={() => toggleObjective(obj.id)}
                    className="border-[var(--t-bord)] data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <span
                    className={`text-sm transition-all ${
                      obj.completed
                        ? 'line-through text-[var(--t-mute3)]'
                        : 'text-[var(--t-text)]'
                    }`}
                  >
                    {obj.text}
                  </span>
                </label>
              ))}
              {currentModule.subObjectives.length === 0 && (
                <p className="text-xs text-[var(--t-mute3)] font-mono">
                  No hay sub-objetivos. Agrega uno abajo.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Agregar objetivo..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addObjective()}
                className="flex-1 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-lg px-3 py-2 text-sm text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-[var(--t-input-focus)] font-mono"
              />
              <Button
                onClick={addObjective}
                size="sm"
                className="bg-[var(--t-mid)] hover:bg-[var(--t-mid-hover)] text-[var(--t-mid-text)] px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
