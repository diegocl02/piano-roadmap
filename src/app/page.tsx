'use client';

import { useState } from 'react';
import { Sprint, SessionPlan, PracticeSession, CompletedDay, StudyCategory, Roadmap } from '@/types';
import { useAppState } from '@/hooks/useAppState';
import { RoadmapList } from '@/components/RoadmapList';
import { RoadmapOverview } from '@/components/RoadmapOverview';
import { SessionConfigurator } from '@/components/SessionConfigurator';
import { PracticeMode } from '@/components/PracticeMode';
import { ThemeToggle } from '@/components/ThemeToggle';

type AppView = 'roadmaps' | 'overview' | 'configure' | 'practice';

export default function Home() {
  const {
    state,
    hydrated,
    createRoadmap,
    renameRoadmap,
    updateRoadmap,
    setSessionPlan,
    startPracticeSession,
    completeDay,
    updatePracticeSession,
  } = useAppState();

  void startPracticeSession;

  const [view, setView] = useState<AppView>('roadmaps');
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);

  // Derive from state so mutations in RoadmapOverview auto-reflect
  const selectedRoadmap: Roadmap | null =
    state.roadmaps.find((r) => r.id === selectedRoadmapId) ?? null;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
        <div className="font-mono text-cyan-400 text-sm animate-pulse tracking-widest">
          LOADING...
        </div>
      </div>
    );
  }

  const handleOpenRoadmap = (roadmap: Roadmap) => {
    setSelectedRoadmapId(roadmap.id);
    setView('overview');
  };

  const handleCreateRoadmap = (name: string) => {
    const roadmap = createRoadmap(name);
    setSelectedRoadmapId(roadmap.id);
    setView('overview');
  };

  const handleSelectSprint = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setView('configure');
  };

  const handleStartSession = (plan: SessionPlan) => {
    setSessionPlan(plan);
    setView('practice');
  };

  const handleCompleteSession = (session: PracticeSession) => {
    if (!selectedSprint) return;
    const byCategory: Record<StudyCategory, number> = {
      technique: 0, jazz: 0, reading: 0, theory: 0, 'ear-training': 0, custom: 0,
    };
    session.modules.forEach((m) => {
      const cat = m.plannedModule.module.category;
      byCategory[cat] = (byCategory[cat] || 0) + Math.floor(m.timeElapsed / 60);
    });
    const day: CompletedDay = {
      date: new Date().toISOString().split('T')[0],
      sprintId: selectedSprint.id,
      totalMinutes: session.plan.totalMinutes,
      byCategory,
    };
    completeDay(day);
    setView('overview');
    setSelectedSprint(null);
  };

  const BackButton = ({ to }: { to: AppView }) => (
    <button
      onClick={() => setView(to)}
      className="fixed top-4 left-4 text-xs font-mono z-10 text-[var(--t-mute2)] hover:text-[var(--t-text)] transition-colors"
    >
      ← VOLVER
    </button>
  );

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {view === 'roadmaps' && (
        <RoadmapList
          roadmaps={state.roadmaps}
          completedDays={state.completedDays}
          onOpen={handleOpenRoadmap}
          onCreate={handleCreateRoadmap}
          onRename={renameRoadmap}
        />
      )}

      {view === 'overview' && selectedRoadmap && (
        <>
          <BackButton to="roadmaps" />
          <RoadmapOverview
            roadmap={selectedRoadmap}
            completedDays={state.completedDays}
            onSelectSprint={handleSelectSprint}
            onUpdate={updateRoadmap}
          />
        </>
      )}

      {view === 'configure' && selectedSprint && (
        <>
          <BackButton to="overview" />
          <SessionConfigurator sprint={selectedSprint} onStart={handleStartSession} />
        </>
      )}

      {view === 'practice' && state.currentSessionPlan && selectedSprint && (
        <PracticeMode
          plan={state.currentSessionPlan}
          onComplete={handleCompleteSession}
          onUpdate={updatePracticeSession}
        />
      )}
    </>
  );
}
