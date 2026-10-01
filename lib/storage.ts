import {
  Routine,
  Plan6Months,
  WorkoutSessionLog,
  WeightRecord,
  PersonalRecord,
  UserFitnessProfile,
  CoachChatMessage,
} from '@/types/gym';

// Storage keys v2: Starts 100% clean with NO mock data
const STORAGE_KEYS = {
  ROUTINES: 'ironpulse_clean_routines_v2',
  ACTIVE_PLAN: 'ironpulse_clean_active_plan_v2',
  WORKOUT_LOGS: 'ironpulse_clean_workout_logs_v2',
  WEIGHT_RECORDS: 'ironpulse_clean_weight_records_v2',
  PERSONAL_RECORDS: 'ironpulse_clean_personal_records_v2',
  USER_PROFILE: 'ironpulse_clean_user_profile_v2',
  ACTIVE_SESSION: 'ironpulse_clean_active_session_v2',
  COACH_CHAT: 'ironpulse_clean_coach_chat_v2',
};

export const GymStorage = {
  getRoutines(): Routine[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveRoutines(routines: Routine[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
    } catch (e) {
      console.error('Failed to save routines to storage', e);
    }
  },

  addRoutine(routine: Routine) {
    const list = this.getRoutines();
    const updated = [routine, ...list.filter((r) => r.id !== routine.id)];
    this.saveRoutines(updated);
    return updated;
  },

  updateExerciseInRoutine(routineId: string, dayId: string, exerciseId: string, updates: Partial<{ targetWeightKg: number; targetReps: string }>) {
    const list = this.getRoutines();
    const routine = list.find((r) => r.id === routineId);
    if (!routine) return list;

    const day = routine.days.find((d) => d.id === dayId);
    if (!day) return list;

    const exercise = day.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return list;

    exercise.sets = exercise.sets.map((s) => ({
      ...s,
      targetWeightKg: updates.targetWeightKg !== undefined ? updates.targetWeightKg : s.targetWeightKg,
      targetReps: updates.targetReps !== undefined ? updates.targetReps : s.targetReps,
    }));

    this.saveRoutines(list);
    return list;
  },

  deleteRoutine(routineId: string) {
    const list = this.getRoutines();
    const updated = list.filter((r) => r.id !== routineId);
    this.saveRoutines(updated);
    return updated;
  },

  getActivePlan(): Plan6Months | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveActivePlan(plan: Plan6Months) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, JSON.stringify(plan));
    } catch (e) {
      console.error('Failed to save active plan', e);
    }
  },

  toggleMilestone(monthIndex: number, milestoneIndex: number) {
    const plan = this.getActivePlan();
    if (!plan || !plan.months[monthIndex]) return null;
    const target = plan.months[monthIndex].milestones[milestoneIndex];
    if (target) {
      target.isCompleted = !target.isCompleted;
      this.saveActivePlan(plan);
    }
    return plan;
  },

  getWorkoutLogs(): WorkoutSessionLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveWorkoutLog(log: WorkoutSessionLog) {
    const logs = this.getWorkoutLogs();
    const updated = [log, ...logs];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    // Update personal records if any
    this.checkAndUpdatePRs(log);
    return updated;
  },

  getWeightRecords(): WeightRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WEIGHT_RECORDS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addWeightRecord(rec: Omit<WeightRecord, 'id'>) {
    const list = this.getWeightRecords();
    const newRecord: WeightRecord = {
      ...rec,
      id: `w-${Date.now()}`,
    };
    const updated = [...list, newRecord].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.WEIGHT_RECORDS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    return updated;
  },

  getPersonalRecords(): PersonalRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  checkAndUpdatePRs(log: WorkoutSessionLog) {
    const currentPRs = this.getPersonalRecords();
    let changed = false;

    log.exercisesCompleted.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.weightKg > 0) {
          const existing = currentPRs.find(
            (p) => p.exerciseName.toLowerCase() === ex.exerciseName.toLowerCase()
          );
          if (!existing) {
            currentPRs.push({
              exerciseName: ex.exerciseName,
              maxWeightKg: set.weightKg,
              maxReps: set.reps,
              date: new Date().toISOString().split('T')[0],
            });
            changed = true;
          } else if (set.weightKg > existing.maxWeightKg) {
            existing.maxWeightKg = set.weightKg;
            existing.maxReps = set.reps;
            existing.date = new Date().toISOString().split('T')[0];
            changed = true;
          }
        }
      });
    });

    if (changed && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(currentPRs));
      } catch (e) {
        console.error(e);
      }
    }
  },

  getUserProfile(): UserFitnessProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveUserProfile(profile: UserFitnessProfile) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  },

  getCoachChat(): CoachChatMessage[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COACH_CHAT);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveCoachChat(messages: CoachChatMessage[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.COACH_CHAT, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  },

  clearCoachChat() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.COACH_CHAT);
  },

  resetAllData() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ROUTINES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAN);
    localStorage.removeItem(STORAGE_KEYS.WORKOUT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.WEIGHT_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.PERSONAL_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.COACH_CHAT);
    window.location.reload();
  },
};
