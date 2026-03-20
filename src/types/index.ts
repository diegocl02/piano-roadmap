// ─── Core Data Types ───────────────────────────────────────────────────────

export type StudyCategory = 'technique' | 'jazz' | 'reading' | 'theory' | 'ear-training' | 'custom';

export interface SessionModule {
  id: string;
  name: string;
  category: StudyCategory;
  description?: string;
  defaultMinutes: number;
  color: string; // tailwind color class accent
}

export interface DailySession {
  id: string;
  modules: SessionModule[];
}

export interface Sprint {
  id: string;
  name: string;
  dayStart: number;
  dayEnd: number;
  session: DailySession;
}

export interface Phase {
  id: string;
  name: string;
  activeDays: number;
  sprints: Sprint[];
}

export interface Roadmap {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  phases: Phase[];
}

// ─── Session Planning ───────────────────────────────────────────────────────

export interface PlannedModule {
  moduleId: string;
  module: SessionModule;
  allocatedMinutes: number;
  selected: boolean;
}

export interface SessionPlan {
  sprintId: string;
  date: string; // ISO date string
  plannedModules: PlannedModule[];
  totalMinutes: number;
}

// ─── Practice Mode ──────────────────────────────────────────────────────────

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface SubObjective {
  id: string;
  text: string;
  completed: boolean;
}

export interface ActiveModule {
  plannedModule: PlannedModule;
  subObjectives: SubObjective[];
  timeElapsed: number; // seconds
  status: TimerStatus;
}

export interface PracticeSession {
  plan: SessionPlan;
  currentModuleIndex: number;
  modules: ActiveModule[];
  sessionStatus: TimerStatus;
  startedAt?: string;
  completedAt?: string;
}

// ─── History & Tracking ─────────────────────────────────────────────────────

export interface CompletedDay {
  date: string; // ISO
  roadmapId: string;
  sprintId: string;
  totalMinutes: number;
  byCategory: Record<StudyCategory, number>;
}

// ─── Library ────────────────────────────────────────────────────────────────

export interface ItemResource {
  id: string;
  url: string;
  label: string;
}

export interface CurriculumItem {
  id: string;
  topicId: string;
  name: string;
  order: number;
  notes?: string;
  resources: ItemResource[];
}

export interface Topic {
  id: string;
  areaId: string;
  name: string;
  order: number;
  items: CurriculumItem[];
}

export interface Area {
  id: string;
  name: string;
  order: number;
  topics: Topic[];
}

// ─── Roadmap Sprint ↔ Library Item ──────────────────────────────────────────

export interface RoadmapSprintItem {
  id: string;
  sprintId: string;    // roadmap sprint id (stored in roadmap JSON)
  roadmapId: string;
  itemId: string;      // library item id
  completed: boolean;
  order: number;
  defaultMinutes: number;
}

// ─── Curriculum Sprints ──────────────────────────────────────────────────────

export interface SprintItem {
  id: string;
  sprintId: string;
  itemId: string;
  completed: boolean;
  order: number;
}

export interface CurriculumSprint {
  id: string;
  name: string;
  dayStart?: number;
  dayEnd?: number;
  createdAt: string;
  sprintItems: SprintItem[];
}

export interface AppState {
  roadmaps: Roadmap[];
  completedDays: CompletedDay[];
  roadmapSprintItems: RoadmapSprintItem[];
  currentSessionPlan: SessionPlan | null;
  activePracticeSession: PracticeSession | null;
  notificationTime?: string; // HH:MM
}
