'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppState, Roadmap, SessionPlan, PracticeSession, CompletedDay } from '@/types';
import { seedRoadmap } from '@/data/seedRoadmap';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const defaultState: AppState = {
  roadmaps: [],
  completedDays: [],
  currentSessionPlan: null,
  activePracticeSession: null,
};

export function useAppState() {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // Load from Supabase whenever the user changes
  useEffect(() => {
    if (!user) {
      setState(defaultState);
      setHydrated(false);
      return;
    }

    const userId = user.id;

    async function load() {
      setHydrated(false);

      const [{ data: roadmapsData }, { data: daysData }] = await Promise.all([
        supabase.from('roadmaps').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('completed_days').select('*').eq('user_id', userId),
      ]);

      let roadmaps: Roadmap[] = (roadmapsData ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        createdAt: r.created_at,
        phases: r.phases ?? [],
      }));

      // Seed default roadmap for new users
      if (roadmaps.length === 0) {
        const { error } = await supabase.from('roadmaps').insert({
          id: seedRoadmap.id,
          user_id: userId,
          name: seedRoadmap.name,
          description: seedRoadmap.description,
          created_at: seedRoadmap.createdAt,
          phases: seedRoadmap.phases,
        });
        if (!error) roadmaps = [seedRoadmap];
      }

      const completedDays: CompletedDay[] = (daysData ?? []).map((d) => ({
        date: d.date,
        roadmapId: d.roadmap_id,
        sprintId: d.sprint_id,
        totalMinutes: d.total_minutes,
        byCategory: d.by_category,
      }));

      setState({ ...defaultState, roadmaps, completedDays });
      setHydrated(true);
    }

    load();
  }, [user]);

  // ─── Mutations (optimistic: update state immediately, sync to DB in background) ──

  const createRoadmap = useCallback(
    (name: string): Roadmap => {
      const roadmap: Roadmap = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        phases: [],
      };
      setState((prev) => ({ ...prev, roadmaps: [...prev.roadmaps, roadmap] }));
      if (user) {
        supabase.from('roadmaps').insert({
          id: roadmap.id,
          user_id: user.id,
          name: roadmap.name,
          created_at: roadmap.createdAt,
          phases: roadmap.phases,
        }).then(({ error }) => {
          if (error) console.error('[createRoadmap]', error.message);
        });
      }
      return roadmap;
    },
    [user]
  );

  const renameRoadmap = useCallback(
    (id: string, name: string) => {
      setState((prev) => ({
        ...prev,
        roadmaps: prev.roadmaps.map((r) => (r.id === id ? { ...r, name: name.trim() } : r)),
      }));
      if (user) {
        supabase.from('roadmaps').update({ name: name.trim() }).eq('id', id)
          .then(({ error }) => {
            if (error) console.error('[renameRoadmap]', error.message);
          });
      }
    },
    [user]
  );

  const updateRoadmap = useCallback(
    (updated: Roadmap) => {
      setState((prev) => ({
        ...prev,
        roadmaps: prev.roadmaps.map((r) => (r.id === updated.id ? updated : r)),
      }));
      if (user) {
        supabase.from('roadmaps').update({
          name: updated.name,
          description: updated.description,
          phases: updated.phases,
        }).eq('id', updated.id)
          .then(({ error }) => {
            if (error) console.error('[updateRoadmap]', error.message);
          });
      }
    },
    [user]
  );

  const setSessionPlan = useCallback((plan: SessionPlan | null) => {
    setState((prev) => ({ ...prev, currentSessionPlan: plan }));
  }, []);

  const startPracticeSession = useCallback((session: PracticeSession) => {
    setState((prev) => ({ ...prev, activePracticeSession: session }));
  }, []);

  const completeDay = useCallback(
    (day: CompletedDay) => {
      setState((prev) => ({
        ...prev,
        completedDays: [
          ...prev.completedDays.filter(
            (d) => !(d.date === day.date && d.sprintId === day.sprintId)
          ),
          day,
        ],
        activePracticeSession: null,
        currentSessionPlan: null,
      }));
      if (user) {
        supabase.from('completed_days').upsert(
          {
            user_id: user.id,
            roadmap_id: day.roadmapId,
            sprint_id: day.sprintId,
            date: day.date,
            total_minutes: day.totalMinutes,
            by_category: day.byCategory,
          },
          { onConflict: 'user_id,sprint_id,date' }
        ).then(({ error }) => {
          if (error) console.error('[completeDay]', error.message);
        });
      }
    },
    [user]
  );

  const updatePracticeSession = useCallback((session: PracticeSession) => {
    setState((prev) => ({ ...prev, activePracticeSession: session }));
  }, []);

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
