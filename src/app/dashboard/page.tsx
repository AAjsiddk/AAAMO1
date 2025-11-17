'use client';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Target,
  ClipboardCheck,
  Repeat,
  Inbox,
  TrendingUp
} from 'lucide-react';
import { TimeWidget } from '@/components/dashboard/time-widget';
import { Progress } from '@/components/ui/progress';
import 'react-circular-progressbar/dist/styles.css';
import Link from 'next/link';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { JournalEntry, Task, Goal, Habit } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

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
      <div className="text-center text-muted-foreground py-8">
        <Inbox className="mx-auto h-12 w-12" />
        <p className="mt-4">لا توجد مذكرات لعرضها بعد.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Link href="/dashboard/journal" key={entry.id} className="flex items-center p-2 rounded-lg hover:bg-muted transition-colors">
          <div className="flex flex-col items-center justify-center bg-muted text-muted-foreground rounded-lg p-2 h-16 w-16 mr-4">
            <span className="text-sm font-bold">{entry.createdAt ? format((entry.createdAt as Timestamp).toDate(), 'MMM') : ''}</span>
            <span className="text-2xl font-bold">{entry.createdAt ? format((entry.createdAt as Timestamp).toDate(), 'dd') : ''}</span>
          </div>
          <div className="space-y-1 overflow-hidden">
            <p className="font-medium hover:underline truncate">{entry.title}</p>
            <p className="text-sm text-muted-foreground truncate">
              {entry.content.substring(0, 100)}...
            </p>
          </div>
        </Link>
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
    <div className="space-y-6">
        {!hasItems ? (
             <div className="text-center text-muted-foreground py-8">
                <TrendingUp className="mx-auto h-12 w-12" />
                <p className="mt-4">ابدأ بإضافة أهداف أو مهام لتتبع تقدمك.</p>
             </div>
        ) : (
        <>
          {latestGoal?.[0] && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Link href="/dashboard/goals" className="font-medium hover:underline flex items-center gap-2"><Target/> <span>آخر هدف: {latestGoal[0].name}</span></Link>
                <span className="text-sm font-bold text-primary">{latestGoal[0].progress || 0}%</span>
              </div>
              <Progress value={latestGoal[0].progress || 0} />
            </div>
          )}
          {latestTask?.[0] && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <Link href="/dashboard/tasks" className="font-medium hover:underline flex items-center gap-2"><ClipboardCheck/> <span>آخر مهمة: {latestTask[0].title}</span></Link>
                <span className="text-sm font-semibold text-primary">{latestTask[0].status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}</span>
              </div>
            </div>
          )}
          {latestHabit?.[0] && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <Link href="/dashboard/habits" className="font-medium hover:underline flex items-center gap-2"><Repeat/> <span>آخر عادة: {latestHabit[0].name}</span></Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

}


export default function DashboardPage() {
  const { user } = useUser();
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          أهلاً بعودتك، {user?.displayName || 'مستخدم'}!
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-2">
          <TimeWidget />
        </div>
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>متابعة التقدم</CardTitle>
            <CardDescription>
              نظرة سريعة على آخر تحديثاتك في الأهداف والمهام والعادات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressTracker />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>آخر المذكرات</CardTitle>
            <CardDescription>
              أحدث ما قمت بتدوينه في مذكراتك الشخصية.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <LatestEntries />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
