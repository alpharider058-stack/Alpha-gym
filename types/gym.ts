export type Gender = 'hombre' | 'mujer' | 'otro';
export type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';
export type FitnessGoal = 'hipertrofia' | 'definicion' | 'fuerza' | 'recomposicion' | 'salud';
export type EquipmentType = 'gym_completo' | 'mancuernas_banco' | 'barra_discos' | 'calistenia_casa';
export type TrainingSplit = 'ppl' | 'torso_pierna' | 'full_body' | 'weider' | 'recomendacion_ia';

export interface UserFitnessProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  experience: ExperienceLevel;
  goal: FitnessGoal;
  daysPerWeek: number;
  selectedDays: string[]; // e.g. ["Lunes", "Miércoles", "Viernes"]
  equipment: EquipmentType;
  sessionDurationMin: number; // e.g. 60
  injuriesOrLimitations: string;
  preferredSplit: TrainingSplit;
}

export interface ExerciseSet {
  setNumber: number;
  targetReps: string; // e.g. "8-10"
  targetWeightKg: number;
  restSeconds: number;
  completedReps?: number;
  completedWeightKg?: number;
  isCompleted?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: 'pecho' | 'espalda' | 'piernas' | 'hombros' | 'brazos' | 'core' | 'cardio' | 'cuerpo_completo';
  sets: ExerciseSet[];
  notes?: string;
  videoTips?: string;
}

export interface RoutineDay {
  id: string;
  name: string; // e.g. "Día 1: Empuje (Pecho, Hombro, Tríceps)"
  dayOfWeek?: string; // e.g. "Lunes"
  targetMuscles: string[];
  estimatedDurationMin: number;
  exercises: Exercise[];
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isAiGenerated: boolean;
  daysPerWeek: number;
  days: RoutineDay[];
  userProfile?: UserFitnessProfile;
}

export interface MonthMilestone {
  week: number;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface MonthPlanDetail {
  month: number;
  title: string;
  phaseName: string;
  focus: string;
  calorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  cardioProtocol: string;
  expectedWeightKg: number;
  strengthMilestone: string;
  deloadWeek: number; // e.g. 4
  trainingGuidelines: string[];
  milestones: MonthMilestone[];
}

export interface Plan6Months {
  id: string;
  generatedAt: string;
  profileSnapshot: UserFitnessProfile;
  overviewSummary: string;
  months: MonthPlanDetail[];
}

export interface CompletedSetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  completedAt: string;
}

export interface CompletedExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: CompletedSetLog[];
}

export interface WorkoutSessionLog {
  id: string;
  routineId: string;
  routineTitle: string;
  dayName: string;
  startedAt: string;
  finishedAt: string;
  durationMinutes: number;
  totalVolumeKg: number;
  exercisesCompleted: CompletedExerciseLog[];
  notes?: string;
  rating?: number; // 1-5
}

export interface WeightRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercent?: number;
  notes?: string;
}

export interface PersonalRecord {
  exerciseName: string;
  maxWeightKg: number;
  maxReps: number;
  date: string;
}

export interface CoachChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  suggestedFollowUps?: string[];
}
