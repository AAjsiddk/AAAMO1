import type { FieldValue, Timestamp } from 'firebase/firestore';

export type Task = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred' | 'cancelled' | 'waiting_for' | 'archived';
  progress?: number;
  startDate?: Timestamp | Date | null;
  endDate?: Timestamp | Date | null;
  relatedGoalId?: string;
  relatedHabitId?: string;
  updatedAt: FieldValue;
  parentId?: string | null;
  // Client-side only
  subtasks?: Task[];
};

export type Habit = {
  id: string;
  userId: string;
  name: string;
  type: 'acquire' | 'quit';
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  frequency?: string;
  streak?: number;
};

export type HabitMark = {
  id: string; // Typically habitId_dateString
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'not_completed' | 'partially_completed';
};

export type Goal = {
    id: string;
    userId: string;
    name: string;
    description?: string;
    motivation?: string;
    startDate?: Timestamp | Date | null;
    endDate?: Timestamp | Date | null;
    progress?: number;
    passwordHash?: string | null;
    updatedAt: FieldValue;
};

export type Folder = {
    id: string;
    userId: string;
    name: string;
    parentId: string | null;
    createdAt: FieldValue;
}

export type File = {
    id: string;
    userId: string;
    name: string;
    folderId: string | null;
    storagePath: string;
    fileType: string;
    createdAt: FieldValue;
}

export type JournalEntry = {
    id: string;
    userId: string;
    title: string;
    content: string;
    mood?: 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious';
    imageUrl?: string;
    createdAt: FieldValue;
}
