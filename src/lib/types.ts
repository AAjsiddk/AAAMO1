import type { FieldValue, Timestamp } from 'firebase/firestore';

export type Task = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred' | 'cancelled' | 'waiting_for' | 'archived';
  progress?: number;
  startDate?: Timestamp | Date;
  endDate?: Timestamp | Date;
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
  frequency?: string;
  streak?: number;
};

export type HabitMark = {
  id: string;
  habitId: string;
  userId: string;
  date: Date | Timestamp;
  completed: boolean;
};

export type Goal = {
    id: string;
    userId: string;
    name: string;
    description?: string;
    motivation?: string;
    startDate?: Timestamp | Date;
    endDate?: Timestamp | Date;
    progress?: number;
    passwordHash?: string;
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
    createdAt: Timestamp;
}
