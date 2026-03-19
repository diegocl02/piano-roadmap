'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppState, Roadmap, SessionPlan, PracticeSession, CompletedDay } from '@/types';

import { seedRoadmap } from '@/data/seedRoadmap';

const STORAGE_KEY = 'piano-roadmap-state';

const defaultState: AppState = {
  roadmaps: [seedRoadmap],
  completedDays: [],
  currentSessionPlan: null,
  activePracticeSession: null,
};

export function useAppState() {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: old format had roadmap (singular)
        if (parsed.roadmap && !parsed.roadmaps) {
          parsed.roadmaps = [parsed.roadmap];
          delete parsed.roadmap;
        }
        setState({ ...defaultState, ...parsed });
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const updateRoadmap = useCallback(
    (updated: Roadmap) => {
      const roadmaps = state.roadmaps.map((r) => (r.id === updated.id ? updated : r));
      persist({ ...state, roadmaps });
    },
    [state, persist]
  );

  const createRoadmap = useCallback(
    (name: string): Roadmap => {
      const roadmap: Roadmap = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        phases: [],
      };
      persist({ ...state, roadmaps: [...state.roadmaps, roadmap] });
      return roadmap;
    },
    [state, persist]
  );

  const renameRoadmap = useCallback(
    (id: string, name: string) => {
      const roadmaps = state.roadmaps.map((r) =>
        r.id === id ? { ...r, name: name.trim() } : r
      );
      persist({ ...state, roadmaps });
    },
    [state, persist]
  );

  const setSessionPlan = useCallback(
    (plan: SessionPlan | null) => {
      persist({ ...state, currentSessionPlan: plan });
    },
    [state, persist]
  );

  const startPracticeSession = useCallback(
    (session: PracticeSession) => {
      persist({ ...state, activePracticeSession: session });
    },
    [state, persist]
  );

  const completeDay = useCallback(
    (day: CompletedDay) => {
      const completedDays = [...state.completedDays.filter((d) => d.date !== day.date), day];
      persist({ ...state, completedDays, activePracticeSession: null, currentSessionPlan: null });
    },
    [state, persist]
  );

  const updatePracticeSession = useCallback(
    (session: PracticeSession) => {
      persist({ ...state, activePracticeSession: session });
    },
    [state, persist]
  );

  return {
    state,
    hydrated,
    createRoadmap,
    renameRoadmap,
    updateRoadmap,
    setSessionPlan,
    startPracticeSession,
    completeDay,
    updatePracticeSession,
  };
}
