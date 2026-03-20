'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Area, Topic, CurriculumItem, CurriculumSprint, SprintItem } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface LibraryState {
  areas: Area[];
  sprints: CurriculumSprint[];
}

const defaultState: LibraryState = { areas: [], sprints: [] };

export function useLibrary() {
  const { user } = useAuth();
  const [state, setState] = useState<LibraryState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (!user) { setState(defaultState); setHydrated(false); return; }
    const userId = user.id;

    async function load() {
      setHydrated(false);
      const [
        { data: areasData },
        { data: topicsData },
        { data: itemsData },
        { data: sprintsData },
        { data: sprintItemsData },
      ] = await Promise.all([
        supabase.from('areas').select('*').eq('user_id', userId).order('order_index'),
        supabase.from('topics').select('*').eq('user_id', userId).order('order_index'),
        supabase.from('items').select('*').eq('user_id', userId).order('order_index'),
        supabase.from('curriculum_sprints').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('sprint_items').select('*').eq('user_id', userId).order('order_index'),
      ]);

      const areas: Area[] = (areasData ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        order: a.order_index,
        topics: (topicsData ?? [])
          .filter((t) => t.area_id === a.id)
          .map((t) => ({
            id: t.id,
            areaId: t.area_id,
            name: t.name,
            order: t.order_index,
            items: (itemsData ?? [])
              .filter((i) => i.topic_id === t.id)
              .map((i) => ({
                id: i.id,
                topicId: i.topic_id,
                name: i.name,
                order: i.order_index,
                notes: i.notes ?? undefined,
                resources: i.resources ?? [],
              })),
          })),
      }));

      const sprints: CurriculumSprint[] = (sprintsData ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        dayStart: s.day_start ?? undefined,
        dayEnd: s.day_end ?? undefined,
        createdAt: s.created_at,
        sprintItems: (sprintItemsData ?? [])
          .filter((si) => si.sprint_id === s.id)
          .map((si) => ({
            id: si.id,
            sprintId: si.sprint_id,
            itemId: si.item_id,
            completed: si.completed,
            order: si.order_index,
          })),
      }));

      setState({ areas, sprints });
      setHydrated(true);
    }

    load();
  }, [user]);

  // Flat list of all items enriched with area/topic names (for sprint builder)
  const allItems = state.areas.flatMap((a) =>
    a.topics.flatMap((t) =>
      t.items.map((i) => ({ ...i, topicName: t.name, areaName: a.name }))
    )
  );

  // ── Area mutations ─────────────────────────────────────────────────────────

  const createArea = useCallback((name: string) => {
    if (!user) return;
    const area: Area = { id: crypto.randomUUID(), name, order: Date.now(), topics: [] };
    setState((prev) => ({ ...prev, areas: [...prev.areas, area] }));
    supabase.from('areas').insert({ id: area.id, user_id: user.id, name, order_index: area.order })
      .then(({ error }) => { if (error) console.error('[createArea]', error.message); });
  }, [user]);

  const renameArea = useCallback((id: string, name: string) => {
    setState((prev) => ({ ...prev, areas: prev.areas.map((a) => a.id === id ? { ...a, name } : a) }));
    if (user) supabase.from('areas').update({ name }).eq('id', id)
      .then(({ error }) => { if (error) console.error('[renameArea]', error.message); });
  }, [user]);

  const deleteArea = useCallback((id: string) => {
    setState((prev) => ({ ...prev, areas: prev.areas.filter((a) => a.id !== id) }));
    if (user) supabase.from('areas').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[deleteArea]', error.message); });
  }, [user]);

  const moveArea = useCallback((id: string, direction: 'up' | 'down') => {
    const sorted = [...stateRef.current.areas].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((a) => a.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reordered = sorted.map((a, i) => ({ ...a, order: i }));
    setState((prev) => ({ ...prev, areas: reordered }));
    if (user) Promise.all(reordered.map((a) =>
      supabase.from('areas').update({ order_index: a.order }).eq('id', a.id)
    )).catch(console.error);
  }, [user]);

  // ── Topic mutations ────────────────────────────────────────────────────────

  const createTopic = useCallback((areaId: string, name: string) => {
    if (!user) return;
    const topic: Topic = { id: crypto.randomUUID(), areaId, name, order: Date.now(), items: [] };
    setState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => a.id === areaId ? { ...a, topics: [...a.topics, topic] } : a),
    }));
    supabase.from('topics').insert({ id: topic.id, user_id: user.id, area_id: areaId, name, order_index: topic.order })
      .then(({ error }) => { if (error) console.error('[createTopic]', error.message); });
  }, [user]);

  const renameTopic = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => ({ ...a, topics: a.topics.map((t) => t.id === id ? { ...t, name } : t) })),
    }));
    if (user) supabase.from('topics').update({ name }).eq('id', id)
      .then(({ error }) => { if (error) console.error('[renameTopic]', error.message); });
  }, [user]);

  const deleteTopic = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => ({ ...a, topics: a.topics.filter((t) => t.id !== id) })),
    }));
    if (user) supabase.from('topics').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[deleteTopic]', error.message); });
  }, [user]);

  const moveTopic = useCallback((id: string, direction: 'up' | 'down') => {
    const area = stateRef.current.areas.find((a) => a.topics.some((t) => t.id === id));
    if (!area) return;
    const sorted = [...area.topics].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((t) => t.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reordered = sorted.map((t, i) => ({ ...t, order: i }));
    setState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => a.id === area.id ? { ...a, topics: reordered } : a),
    }));
    if (user) Promise.all(reordered.map((t) =>
      supabase.from('topics').update({ order_index: t.order }).eq('id', t.id)
    )).catch(console.error);
  }, [user]);

  // ── Item mutations ─────────────────────────────────────────────────────────

  const createItem = useCallback((topicId: string, name: string) => {
    if (!user) return;
    const item: CurriculumItem = { id: crypto.randomUUID(), topicId, name, order: Date.now(), resources: [] };
    setState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => ({
        ...a,
        topics: a.topics.map((t) => t.id === topicId ? { ...t, items: [...t.items, item] } : t),
      })),
    }));
    supabase.from('items').insert({
      id: item.id, user_id: user.id, topic_id: topicId, name, order_index: item.order, resources: [],
    }).then(({ error }) => { if (error) console.error('[createItem]', error.message); });
  }, [user]);

  const updateItem = useCallback((updated: CurriculumItem) => {
    setState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => ({
        ...a,
        topics: a.topics.map((t) => ({
          ...t,
          items: t.items.map((i) => i.id === updated.id ? updated : i),
        })),
      })),
    }));
    if (user) supabase.from('items').update({
      name: updated.name,
      notes: updated.notes ?? null,
      resources: updated.resources,
    }).eq('id', updated.id)
      .then(({ error }) => { if (error) console.error('[updateItem]', error.message); });
  }, [user]);

  const deleteItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => ({
        ...a,
        topics: a.topics.map((t) => ({ ...t, items: t.items.filter((i) => i.id !== id) })),
      })),
    }));
    if (user) supabase.from('items').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[deleteItem]', error.message); });
  }, [user]);

  const moveItem = useCallback((id: string, direction: 'up' | 'down') => {
    let foundArea: Area | undefined;
    let foundTopic: Topic | undefined;
    for (const a of stateRef.current.areas) {
      for (const t of a.topics) {
        if (t.items.some((i) => i.id === id)) { foundArea = a; foundTopic = t; break; }
      }
      if (foundTopic) break;
    }
    if (!foundArea || !foundTopic) return;
    const sorted = [...foundTopic.items].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((i) => i.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reordered = sorted.map((item, i) => ({ ...item, order: i }));
    const aId = foundArea.id, tId = foundTopic.id;
    setState((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => a.id === aId ? {
        ...a,
        topics: a.topics.map((t) => t.id === tId ? { ...t, items: reordered } : t),
      } : a),
    }));
    if (user) Promise.all(reordered.map((i) =>
      supabase.from('items').update({ order_index: i.order }).eq('id', i.id)
    )).catch(console.error);
  }, [user]);

  // ── Sprint mutations ───────────────────────────────────────────────────────

  const createSprint = useCallback((name: string, dayStart?: number, dayEnd?: number) => {
    if (!user) return;
    const sprint: CurriculumSprint = {
      id: crypto.randomUUID(), name, dayStart, dayEnd,
      createdAt: new Date().toISOString(), sprintItems: [],
    };
    setState((prev) => ({ ...prev, sprints: [...prev.sprints, sprint] }));
    supabase.from('curriculum_sprints').insert({
      id: sprint.id, user_id: user.id, name,
      day_start: dayStart ?? null, day_end: dayEnd ?? null, created_at: sprint.createdAt,
    }).then(({ error }) => { if (error) console.error('[createSprint]', error.message); });
  }, [user]);

  const renameSprint = useCallback((id: string, name: string) => {
    setState((prev) => ({ ...prev, sprints: prev.sprints.map((s) => s.id === id ? { ...s, name } : s) }));
    if (user) supabase.from('curriculum_sprints').update({ name }).eq('id', id)
      .then(({ error }) => { if (error) console.error('[renameSprint]', error.message); });
  }, [user]);

  const deleteSprint = useCallback((id: string) => {
    setState((prev) => ({ ...prev, sprints: prev.sprints.filter((s) => s.id !== id) }));
    if (user) supabase.from('curriculum_sprints').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[deleteSprint]', error.message); });
  }, [user]);

  const addItemToSprint = useCallback((sprintId: string, itemId: string) => {
    if (!user) return;
    const sprintItem: SprintItem = {
      id: crypto.randomUUID(), sprintId, itemId, completed: false, order: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      sprints: prev.sprints.map((s) =>
        s.id === sprintId ? { ...s, sprintItems: [...s.sprintItems, sprintItem] } : s
      ),
    }));
    supabase.from('sprint_items').insert({
      id: sprintItem.id, user_id: user.id, sprint_id: sprintId, item_id: itemId,
      completed: false, order_index: sprintItem.order,
    }).then(({ error }) => { if (error) console.error('[addItemToSprint]', error.message); });
  }, [user]);

  const removeItemFromSprint = useCallback((sprintItemId: string) => {
    setState((prev) => ({
      ...prev,
      sprints: prev.sprints.map((s) => ({
        ...s, sprintItems: s.sprintItems.filter((si) => si.id !== sprintItemId),
      })),
    }));
    if (user) supabase.from('sprint_items').delete().eq('id', sprintItemId)
      .then(({ error }) => { if (error) console.error('[removeItemFromSprint]', error.message); });
  }, [user]);

  const toggleSprintItem = useCallback((sprintItemId: string) => {
    let current = false;
    for (const s of stateRef.current.sprints) {
      const si = s.sprintItems.find((si) => si.id === sprintItemId);
      if (si) { current = si.completed; break; }
    }
    const newCompleted = !current;
    setState((prev) => ({
      ...prev,
      sprints: prev.sprints.map((s) => ({
        ...s,
        sprintItems: s.sprintItems.map((si) =>
          si.id === sprintItemId ? { ...si, completed: newCompleted } : si
        ),
      })),
    }));
    if (user) supabase.from('sprint_items').update({ completed: newCompleted }).eq('id', sprintItemId)
      .then(({ error }) => { if (error) console.error('[toggleSprintItem]', error.message); });
  }, [user]);

  return {
    state,
    hydrated,
    allItems,
    createArea, renameArea, deleteArea, moveArea,
    createTopic, renameTopic, deleteTopic, moveTopic,
    createItem, updateItem, deleteItem, moveItem,
    createSprint, renameSprint, deleteSprint,
    addItemToSprint, removeItemFromSprint, toggleSprintItem,
  };
}
