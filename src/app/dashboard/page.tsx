'use client';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Target,
  ClipboardCheck,
  Repeat,
  Inbox,
  TrendingUp
} from 'lucide-react';
import { TimeWidget } from '@/components/dashboard/time-widget';
import 'react-circular-progressbar/dist/styles.css';
import Link from 'next/link';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { JournalEntry, Task, Goal, Habit } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';


function LatestEntries() {
  const { user } = useUser();
  const firestore = useFirestore();

  const entriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    const entriesRef = collection(firestore, `users/${user.uid}/journalEntries`);
    return query(entriesRef, orderBy('createdAt', 'desc'), limit(3));
  }, [user, firestore]);

  const { data: entries, isLoading } = useCollection<JournalEntry>(entriesQuery);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
           <div key={i} className="flex items-center space-x-4 space-x-reverse">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center text-muted py-8">
        <Inbox className="mx-auto h-12 w-12" />
        <p className="mt-4">لا توجد مذكرات لعرضها بعد.</p>
      </div>
    );
  }

  return (
     <div className="mt-4 space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
          <div>
            <div className="font-medium">{entry.title}</div>
            <div className="text-xs text-muted truncate max-w-xs">{entry.content}</div>
          </div>
          <div className="text-xs bg-gray-800 px-3 py-2 rounded-lg text-nowrap">
            {entry.createdAt ? format((entry.createdAt as Timestamp).toDate(), 'dd MMM') : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressTracker() {
  const { user } = useUser();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/tasks`), orderBy('updatedAt', 'desc'), limit(1)) : null), [user, firestore]);
  const goalsQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/goals`), orderBy('updatedAt', 'desc'), limit(1)) : null), [user, firestore]);
  const habitsQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/habits`), orderBy('name', 'desc'), limit(1)) : null), [user, firestore]);

  const { data: latestTask, isLoading: loadingTasks } = useCollection<Task>(tasksQuery);
  const { data: latestGoal, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery);
  const { data: latestHabit, isLoading: loadingHabits } = useCollection<Habit>(habitsQuery);
  
  const isLoading = loadingTasks || loadingGoals || loadingHabits;
  const progress = latestGoal?.[0]?.progress || 0;

  if (isLoading) {
    return (
       <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
            </div>
        ))}
      </div>
    )
  }
  
  const hasItems = latestTask?.length || latestGoal?.length || latestHabit?.length;

  return (
    <div className="mt-6">
        {!hasItems ? (
             <div className="text-center text-muted py-8">
                <TrendingUp className="mx-auto h-12 w-12" />
                <p className="mt-4">ابدأ بإضافة أهداف أو مهام لتتبع تقدمك.</p>
             </div>
        ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted">متابعة التقدم</span>
                <span className="text-sm font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div className="h-3 rounded-full" style={{width: `${progress}%`, background: "linear-gradient(90deg, var(--accent1-hsl), var(--accent2-hsl))"}}></div>
              </div>
            </div>
      )}
    </div>
  )

}


export default function DashboardPage() {
  const { user } = useUser();
  
  return (
     <div className="min-h-screen bg-bg text-gray-100 font-inter p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              أهلاً بعودتك، <span className="text-accent-1">{user?.displayName || 'مستخدم'}!</span>
            </h1>
            <p className="text-sm text-muted mt-1">
              {new Date().toLocaleDateString('ar-SA-u-ca-islamic', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-card-bg p-6 rounded-2xl border border-glass-border backdrop-blur-xs shadow-soft-glow relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full" style={{background: "linear-gradient(135deg, rgba(124,92,255,0.16), rgba(0,224,183,0.08))", filter: "blur(36px)"}} />
            <div className="relative z-10">
              <TimeWidget />
              <ProgressTracker />
            </div>
          </div>
          
          <aside className="space-y-5">
            <div className="bg-card-bg p-4 rounded-2xl border border-glass-border backdrop-blur-xs shadow-card-deep">
              <h3 className="font-semibold text-lg">آخر المذكرات</h3>
              <p className="text-muted text-sm mt-1">أحدث ما قمت بتدوينه في مذكرتك.</p>
              <LatestEntries />
            </div>

            <div className="bg-card-bg p-4 rounded-2xl border border-glass-border backdrop-blur-xs shadow-card-deep">
              <h3 className="font-semibold">الإجراءات السريعة</h3>
              <div className="mt-3 flex flex-col gap-3">
                 <Button asChild className="w-full py-2 rounded-lg font-semibold bg-gradient-to-r from-accent-1 to-accent-2 shadow-soft-glow !text-white">
                    <Link href="/dashboard/journal">بدء مذكّرة جديدة</Link>
                </Button>
                <Button asChild variant="outline" className="w-full py-2 rounded-lg font-semibold border-white/10 bg-transparent hover:bg-white/5">
                   <Link href="/dashboard/tasks">عرض كل المهام</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
