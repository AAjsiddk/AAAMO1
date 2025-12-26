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
  order: number;
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
  userId:string;
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

export type ImportantFile = {
    id: string;
    userId: string;
    name: string;
    location: string;
    importance: 'low' | 'normal' | 'high' | 'urgent';
    pinned: boolean;
    order: number;
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
    createdAt: FieldValue | Timestamp;
    updatedAt: FieldValue;
}

export type FutureMessage = {
  id: string;
  userId: string;
  message: string;
  createdAt: FieldValue;
  status: 'pending' | 'completed' | 'not_completed';
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
  notes?: string;
  date: string; // YYYY-MM-DD
  createdAt: FieldValue;
}

export type RelaxationSubtask = {
  id: string;
  content: string;
  status: 'pending' | 'completed' | 'not_completed';
  order: number;
};

export type RelaxationActivity = {
  id: string;
  userId: string;
  title: string;
  status: 'pending' | 'completed' | 'not_completed';
  pinned: boolean;
  order: number;
  createdAt: FieldValue;
  parentId: string | null;
  // Client side
  subtasks: RelaxationActivity[];
};

export type ExerciseSet = {
  reps: number;
  weight: number;
};

export type Exercise = {
  id: string; // Should be unique within the workout
  name: string;
  sets: ExerciseSet[];
};

export type WorkoutSession = {
  id: string;
  title: string; // e.g., "Chest Day"
  exercises: Exercise[];
};

export type FoodIntake = {
    id: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    category: 'meal' | 'supplement';
    description: string;
}

export type HealthEntry = {
    id: string; // Will be the date string 'yyyy-MM-dd'
    userId: string;
    date: string; // YYYY-MM-DD
    foodIntake: FoodIntake[];
    workouts: WorkoutSession[];
    notes: string;
    createdAt: FieldValue;
    updatedAt: FieldValue;
}

export type ForbiddenFood = {
  id: string;
  userId: string;
  name: string;
  reason?: string;
  createdAt: FieldValue;
};


export type Course = {
    id: string;
    userId: string;
    title: string;
    url: string;
    notes: string;
    pinned: boolean;
    order: number;
    createdAt: FieldValue;
}

export type Inspiration = {
  id: string;
  userId: string;
  content: string;
  createdAt: FieldValue;
}

export type Prayer = {
    id: string; // date_prayerName e.g. 2024-07-30_Fajr
    userId: string;
    date: string; // YYYY-MM-DD
    prayerName: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
    isDoneInMosque: boolean;
    notes?: string;
    updatedAt: FieldValue;
}

export type Saving = {
  id: string;
  userId: string;
  amount: number;
  note: string;
  createdAt: FieldValue;
};

export type StudySubtask = {
  id: string;
  content: string;
  status: 'pending' | 'completed' | 'not_completed';
  order: number;
};

export type StudyPlan = {
  id: string;
  userId: string;
  title: string;
  status: 'pending' | 'completed' | 'not_completed';
  pinned: boolean;
  subtasks: StudySubtask[];
  order: number;
  createdAt: FieldValue;
};
