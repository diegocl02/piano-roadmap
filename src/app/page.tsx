'use client';

import { useState, useEffect } from 'react';
import { Roadmap, Sprint, SessionPlan, PracticeSession, CompletedDay, StudyCategory } from '@/types';
import { useAppState } from '@/hooks/useAppState';
import { useLibrary } from '@/hooks/useLibrary';
import { useAuth } from '@/contexts/AuthContext';
import { RoadmapList } from '@/components/RoadmapList';
import { RoadmapOverview } from '@/components/RoadmapOverview';
import { SessionConfigurator } from '@/components/SessionConfigurator';
import { PracticeMode } from '@/components/PracticeMode';
import { LibraryScreen } from '@/components/LibraryScreen';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoginScreen } from '@/components/LoginScreen';
import { LogOut } from 'lucide-react';

type AppView = 'roadmaps' | 'library' | 'overview' | 'configure' | 'practice';

const TOP_LEVEL_VIEWS: AppView[] = ['roadmaps', 'library'];
const NAV_LABELS: Record<string, string> = { roadmaps: 'ROADMAPS', library: 'LIBRERÍA' };

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const lib = useLibrary();
  const {
    state,
    hydrated,
    createRoadmap,
    deleteRoadmap,
    renameRoadmap,
    updateRoadmap,
    setSessionPlan,
    startPracticeSession,
    completeDay,
    updatePracticeSession,
    addRoadmapSprintItem,
    removeRoadmapSprintItem,
    toggleRoadmapSprintItem,
    updateRoadmapSprintItemMinutes,
  } = useAppState();

  void startPracticeSession;

  const [view, setView] = useState<AppView>(() => {
    try { return (sessionStorage.getItem('pra_view') as AppView) ?? 'roadmaps'; } catch { return 'roadmaps'; }
  });
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(() => {
    try { return sessionStorage.getItem('pra_roadmap_id'); } catch { return null; }
  });
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(() => {
    try { const s = sessionStorage.getItem('pra_sprint'); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('pra_view', view);
      selectedRoadmapId
        ? sessionStorage.setItem('pra_roadmap_id', selectedRoadmapId)
        : sessionStorage.removeItem('pra_roadmap_id');
      selectedSprint
        ? sessionStorage.setItem('pra_sprint', JSON.stringify(selectedSprint))
        : sessionStorage.removeItem('pra_sprint');
    } catch {}
  }, [view, selectedRoadmapId, selectedSprint]);

  const selectedRoadmap: Roadmap | null =
    state.roadmaps.find((r) => r.id === selectedRoadmapId) ?? null;

  // ── Auth loading ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
        <div className="font-mono text-cyan-400 text-sm animate-pulse tracking-widest">
          LOADING...
        </div>
      </div>
    );
  }

  // ── Not logged in ──
  if (!user) return <LoginScreen />;

  // ── Data loading ──
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
        <div className="font-mono text-cyan-400 text-sm animate-pulse tracking-widest">
          CARGANDO...
        </div>
      </div>
    );
  }

  const handleOpenRoadmap = (roadmap: Roadmap) => {
    setSelectedRoadmapId(roadmap.id);
    setView('overview');
  };

  const handleUpdateDescription = (id: string, description: string) => {
    const roadmap = state.roadmaps.find((r) => r.id === id);
    if (roadmap) updateRoadmap({ ...roadmap, description });
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
    if (!selectedSprint || !selectedRoadmapId) return;
    const byCategory: Record<StudyCategory, number> = {
      technique: 0, jazz: 0, reading: 0, theory: 0, 'ear-training': 0, custom: 0,
    };
    session.modules.forEach((m) => {
      const cat = m.plannedModule.module.category;
      byCategory[cat] = (byCategory[cat] || 0) + Math.floor(m.timeElapsed / 60);
    });
    const day: CompletedDay = {
      date: new Date().toISOString().split('T')[0],
      roadmapId: selectedRoadmapId,
      sprintId: selectedSprint.id,
      totalMinutes: Math.round(
        session.modules.reduce((s, m) => s + m.timeElapsed, 0) / 60
      ),
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
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1">
        <ThemeToggle />
        <button
          onClick={signOut}
          title="Cerrar sesión"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--t-mute)] hover:text-[var(--t-text)] hover:bg-[var(--t-surf2)] transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Section nav (top-level views only) */}
      {TOP_LEVEL_VIEWS.includes(view) && (
        <div className="fixed top-4 left-4 z-50 flex items-center gap-0.5">
          {TOP_LEVEL_VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs font-mono px-2.5 py-1 rounded-md transition-colors ${
                view === v
                  ? 'text-cyan-400 bg-[var(--t-surf2)]'
                  : 'text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:bg-[var(--t-surf)]'
              }`}
            >
              {NAV_LABELS[v]}
            </button>
          ))}
        </div>
      )}

      {view === 'roadmaps' && (
        <RoadmapList
          roadmaps={state.roadmaps}
          completedDays={state.completedDays}
          onOpen={handleOpenRoadmap}
          onCreate={handleCreateRoadmap}
          onRename={renameRoadmap}
          onUpdateDescription={handleUpdateDescription}
          onDelete={deleteRoadmap}
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
            allLibItems={lib.allItems}
            roadmapSprintItems={state.roadmapSprintItems.filter((si) => si.roadmapId === selectedRoadmapId)}
            onAddSprintItem={addRoadmapSprintItem}
            onRemoveSprintItem={removeRoadmapSprintItem}
            onToggleSprintItem={toggleRoadmapSprintItem}
            onUpdateSprintItemMinutes={updateRoadmapSprintItemMinutes}
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

      {view === 'library' && <LibraryScreen lib={lib} />}
    </>
  );
}
