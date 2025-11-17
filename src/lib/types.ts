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

export type Note = {
  id: string;
  userId: string;
  content: string;
  color: 'default' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
  pinned: boolean;
  order: number;
  createdAt: FieldValue;
};


export type ProjectTask = {
    id: string;
    content: string;
    columnId: 'todo' | 'in-progress' | 'done';
    userId: string;
    createdAt: FieldValue;
}

export type Habit = {
  id: string;
  userId: string;
  name: string;
  type: 'acquire' | 'quit';
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
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
    imageUrls?: string[];
    createdAt: FieldValue;
    updatedAt: FieldValue;
}

export type FutureMessage = {
  id: string;
  userId: string;
  message: string;
  createdAt: FieldValue;
  // In a real app, you would add a `sendAt: Timestamp` field
};

export type LibraryItem = {
  id: string;
  userId: string;
  title: string;
  type: 'book' | 'article' | 'video' | 'link';
  source: string; // URL for link/video, name for book
  imageUrl?: string;
  description?: string;
  impactfulQuote?: string;
  createdAt: FieldValue;
};

export type WorshipAct = {
  id: string;
  userId: string;
  name: string;
  count?: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  createdAt: FieldValue;
}

export type RelaxationActivity = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  createdAt: FieldValue;
}
