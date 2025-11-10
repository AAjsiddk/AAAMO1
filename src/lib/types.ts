import type { FieldValue, Timestamp } from 'firebase/firestore';

export type Task = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred' | 'cancelled' | 'waiting_for' | 'archived';
  progress?: number;
  startDate?: Timestamp;
  endDate?: Timestamp;
  relatedGoalId?: string;
  relatedHabitId?: string;
  updatedAt: FieldValue;
};

export type Habit = {
  id: string;
  userId: string;
  name: string;
  type: 'acquire' | 'quit';
  frequency?: string;
  streak?: number;
};
