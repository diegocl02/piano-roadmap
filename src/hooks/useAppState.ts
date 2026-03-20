'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppState, Roadmap, SessionPlan, PracticeSession, CompletedDay, RoadmapSprintItem } from '@/types';
import { seedRoadmap } from '@/data/seedRoadmap';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const defaultState: AppState = {
  roadmaps: [],
  completedDays: [],
  roadmapSprintItems: [],
  currentSessionPlan: null,
  activePracticeSession: null,
};

export function useAppState() {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => {
    try {
      const plan = sessionStorage.getItem('pra_plan');
      const active = sessionStorage.getItem('pra_active');
      return {
        ...defaultState,
        currentSessionPlan: plan ? JSON.parse(plan) : null,
        activePracticeSession: active ? JSON.parse(active) : null,
      };
    } catch { return defaultState; }
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      state.currentSessionPlan
        ? sessionStorage.setItem('pra_plan', JSON.stringify(state.currentSessionPlan))
        : sessionStorage.removeItem('pra_plan');
      state.activePracticeSession
        ? sessionStorage.setItem('pra_active', JSON.stringify(state.activePracticeSession))
        : sessionStorage.removeItem('pra_active');
    } catch {}
  }, [state.currentSessionPlan, state.activePracticeSession]);

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

      const [{ data: roadmapsData }, { data: daysData }, { data: sprintItemsData }] = await Promise.all([
        supabase.from('roadmaps').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('completed_days').select('*').eq('user_id', userId),
        supabase.from('roadmap_sprint_items').select('*').eq('user_id', userId),
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

      const roadmapSprintItems: RoadmapSprintItem[] = (sprintItemsData ?? []).map((si) => ({
        id: si.id,
        sprintId: si.sprint_id,
        roadmapId: si.roadmap_id,
        itemId: si.item_id,
        completed: si.completed,
        order: si.order_index,
        defaultMinutes: si.default_minutes ?? 15,
      }));

      setState((prev) => ({ ...prev, roadmaps, completedDays, roadmapSprintItems }));
      setHydrated(true);
    }

    load();
  }, [user]);

  // ─── Mutations (optimistic: update state immediately, sync to DB in background) ──

  const deleteRoadmap = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        roadmaps: prev.roadmaps.filter((r) => r.id !== id),
        completedDays: prev.completedDays.filter((d) => d.roadmapId !== id),
      }));
      if (user) {
        supabase.from('roadmaps').delete().eq('id', id)
          .then(({ error }) => {
            if (error) console.error('[deleteRoadmap]', error.message);
          });
      }
    },
    [user]
  );

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

  const addRoadmapSprintItem = useCallback(
    (sprintId: string, roadmapId: string, itemId: string) => {
      if (!user) return;
      const si: RoadmapSprintItem = {
        id: crypto.randomUUID(), sprintId, roadmapId, itemId, completed: false, order: Date.now(), defaultMinutes: 15,
      };
      setState((prev) => ({ ...prev, roadmapSprintItems: [...prev.roadmapSprintItems, si] }));
      supabase.from('roadmap_sprint_items').insert({
        id: si.id, user_id: user.id, roadmap_id: roadmapId, sprint_id: sprintId,
        item_id: itemId, completed: false, order_index: si.order, default_minutes: 15,
      }).then(({ error }) => { if (error) console.error('[addRoadmapSprintItem]', error.message); });
    },
    [user]
  );

  const removeRoadmapSprintItem = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        roadmapSprintItems: prev.roadmapSprintItems.filter((si) => si.id !== id),
      }));
      if (user) supabase.from('roadmap_sprint_items').delete().eq('id', id)
        .then(({ error }) => { if (error) console.error('[removeRoadmapSprintItem]', error.message); });
    },
    [user]
  );

  const updateRoadmapSprintItemMinutes = useCallback(
    (id: string, minutes: number) => {
      setState((prev) => ({
        ...prev,
        roadmapSprintItems: prev.roadmapSprintItems.map((si) =>
          si.id === id ? { ...si, defaultMinutes: minutes } : si
        ),
      }));
      if (user) supabase.from('roadmap_sprint_items').update({ default_minutes: minutes }).eq('id', id)
        .then(({ error }) => { if (error) console.error('[updateRoadmapSprintItemMinutes]', error.message); });
    },
    [user]
  );

  const toggleRoadmapSprintItem = useCallback(
    (id: string) => {
      setState((prev) => {
        const si = prev.roadmapSprintItems.find((x) => x.id === id);
        if (!si) return prev;
        const newCompleted = !si.completed;
        if (user) supabase.from('roadmap_sprint_items').update({ completed: newCompleted }).eq('id', id)
          .then(({ error }) => { if (error) console.error('[toggleRoadmapSprintItem]', error.message); });
        return {
          ...prev,
          roadmapSprintItems: prev.roadmapSprintItems.map((x) =>
            x.id === id ? { ...x, completed: newCompleted } : x
          ),
        };
      });
    },
    [user]
  );

  return {
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
  };
}
