'use client';

import { useSyncExternalStore } from 'react';
import { Routine, Plan6Months, WorkoutSessionLog, WeightRecord, PersonalRecord } from '@/types/gym';
import { STORAGE_KEYS, subscribeToGymStorage } from '@/lib/storage';

let isClientMounted = false;
const clientMountListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  // Defer to ensure initial hydration render matches SSR snapshot
  setTimeout(() => {
    isClientMounted = true;
    clientMountListeners.forEach((listener) => listener());
  }, 0);
}

function subscribeClientMount(callback: () => void) {
  clientMountListeners.add(callback);
  return () => {
    clientMountListeners.delete(callback);
  };
}

export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeClientMount,
    () => isClientMounted,
    () => false
  );
}

// Constant empty references for server and initial hydration stability
const EMPTY_ROUTINES: Routine[] = [];
let cachedRoutinesRaw: string | null = null;
let cachedRoutines: Routine[] = EMPTY_ROUTINES;

function getRoutinesSnapshot(): Routine[] {
  if (typeof window === 'undefined') return EMPTY_ROUTINES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTINES);
    if (raw !== cachedRoutinesRaw) {
      cachedRoutinesRaw = raw;
      cachedRoutines = raw ? JSON.parse(raw) : EMPTY_ROUTINES;
    }
    return cachedRoutines;
  } catch {
    return EMPTY_ROUTINES;
  }
}

function getServerRoutinesSnapshot(): Routine[] {
  return EMPTY_ROUTINES;
}

export function useGymRoutines(): Routine[] {
  return useSyncExternalStore(
    subscribeToGymStorage,
    getRoutinesSnapshot,
    getServerRoutinesSnapshot
  );
}

let cachedPlanRaw: string | null = null;
let cachedPlan: Plan6Months | null = null;

function getActivePlanSnapshot(): Plan6Months | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
    if (raw !== cachedPlanRaw) {
      cachedPlanRaw = raw;
      cachedPlan = raw ? JSON.parse(raw) : null;
    }
    return cachedPlan;
  } catch {
    return null;
  }
}

function getServerPlanSnapshot(): Plan6Months | null {
  return null;
}

export function useGymActivePlan(): Plan6Months | null {
  return useSyncExternalStore(
    subscribeToGymStorage,
    getActivePlanSnapshot,
    getServerPlanSnapshot
  );
}

const EMPTY_LOGS: WorkoutSessionLog[] = [];
let cachedLogsRaw: string | null = null;
let cachedLogs: WorkoutSessionLog[] = EMPTY_LOGS;

function getWorkoutLogsSnapshot(): WorkoutSessionLog[] {
  if (typeof window === 'undefined') return EMPTY_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS);
    if (raw !== cachedLogsRaw) {
      cachedLogsRaw = raw;
      cachedLogs = raw ? JSON.parse(raw) : EMPTY_LOGS;
    }
    return cachedLogs;
  } catch {
    return EMPTY_LOGS;
  }
}

function getServerWorkoutLogsSnapshot(): WorkoutSessionLog[] {
  return EMPTY_LOGS;
}

export function useGymWorkoutLogs(): WorkoutSessionLog[] {
  return useSyncExternalStore(
    subscribeToGymStorage,
    getWorkoutLogsSnapshot,
    getServerWorkoutLogsSnapshot
  );
}

const EMPTY_WEIGHTS: WeightRecord[] = [];
let cachedWeightsRaw: string | null = null;
let cachedWeights: WeightRecord[] = EMPTY_WEIGHTS;

function getWeightRecordsSnapshot(): WeightRecord[] {
  if (typeof window === 'undefined') return EMPTY_WEIGHTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEIGHT_RECORDS);
    if (raw !== cachedWeightsRaw) {
      cachedWeightsRaw = raw;
      cachedWeights = raw ? JSON.parse(raw) : EMPTY_WEIGHTS;
    }
    return cachedWeights;
  } catch {
    return EMPTY_WEIGHTS;
  }
}

function getServerWeightRecordsSnapshot(): WeightRecord[] {
  return EMPTY_WEIGHTS;
}

export function useGymWeightRecords(): WeightRecord[] {
  return useSyncExternalStore(
    subscribeToGymStorage,
    getWeightRecordsSnapshot,
    getServerWeightRecordsSnapshot
  );
}

const EMPTY_PRS: PersonalRecord[] = [];
let cachedPRsRaw: string | null = null;
let cachedPRs: PersonalRecord[] = EMPTY_PRS;

function getPRsSnapshot(): PersonalRecord[] {
  if (typeof window === 'undefined') return EMPTY_PRS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
    if (raw !== cachedPRsRaw) {
      cachedPRsRaw = raw;
      cachedPRs = raw ? JSON.parse(raw) : EMPTY_PRS;
    }
    return cachedPRs;
  } catch {
    return EMPTY_PRS;
  }
}

function getServerPRsSnapshot(): PersonalRecord[] {
  return EMPTY_PRS;
}

export function useGymPersonalRecords(): PersonalRecord[] {
  return useSyncExternalStore(
    subscribeToGymStorage,
    getPRsSnapshot,
    getServerPRsSnapshot
  );
}
