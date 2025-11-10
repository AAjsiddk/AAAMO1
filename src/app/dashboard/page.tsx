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
  FilePlus,
  Target,
  Book,
  ClipboardCheck,
  Repeat,
  Inbox,
} from 'lucide-react';
import { TimeWidget } from '@/components/dashboard/time-widget';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Link from 'next/link';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { JournalEntry } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

function LatestJournalEntries() {
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
        <div className="flex items-center space-x-4 space-x-reverse">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
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
        <div key={entry.id} className="flex items-center">
          <div className="flex flex-col items-center justify-center bg-muted text-muted-foreground rounded-lg p-2 h-16 w-16 mr-4">
            <span className="text-sm font-bold">{format(entry.createdAt.toDate(), 'MMM')}</span>
            <span className="text-2xl font-bold">{format(entry.createdAt.toDate(), 'dd')}</span>
          </div>
          <div className="space-y-1">
            <Link href="/dashboard/journal" className="font-medium hover:underline">{entry.title}</Link>
            <p className="text-sm text-muted-foreground truncate">
              {entry.content.substring(0, 100)}...
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}


export default function DashboardPage() {
  const { user } = useUser();
  const dailyProgress = 66; // Placeholder value

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          أهلاً بعودتك، {user?.displayName || 'مستخدم'}!
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TimeWidget />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              مؤشر الإنجاز اليومي
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="mx-auto w-32 h-32">
                <CircularProgressbar
                  value={dailyProgress}
                  text={`${dailyProgress}%`}
                  styles={buildStyles({
                    textColor: 'hsl(var(--foreground))',
                    pathColor: 'hsl(var(--primary))',
                    trailColor: 'hsl(var(--muted))',
                    textSize: '16px',
                  })}
                />
              </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>إضافة سريعة</CardTitle>
            <CardDescription>
              ابدأ في تنظيم عالمك بخطوة واحدة.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button asChild variant="outline" className="flex flex-col h-24">
              <Link href="/dashboard/goals">
                <Target className="h-8 w-8 mb-2 text-primary" />
                <span>هدف</span>
              </Link>
            </Button>
             <Button asChild variant="outline" className="flex flex-col h-24">
              <Link href="/dashboard/habits">
                <Repeat className="h-8 w-8 mb-2 text-primary" />
                <span>عادة</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex flex-col h-24">
              <Link href="/dashboard/tasks">
                <ClipboardCheck className="h-8 w-8 mb-2 text-primary" />
                <span>مهمة</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex flex-col h-24">
              <Link href="/dashboard/journal">
                <Book className="h-8 w-8 mb-2 text-primary" />
                <span>مذكرة</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex flex-col h-24">
              <Link href="/dashboard/files">
                <FilePlus className="h-8 w-8 mb-2 text-primary" />
                <span>ملف</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>آخر المذكرات</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <LatestJournalEntries />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>تذكير اليوم</CardTitle>
             <CardDescription>
              رسالتك اليومية للتحفيز والإلهام.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-center text-muted-foreground py-8">"لا تؤجل عمل اليوم إلى الغد."</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
