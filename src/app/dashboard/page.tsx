"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Task, Goal, Habit, JournalEntry } from '@/lib/types';
import { useMemo } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { TimeWidget } from "@/components/dashboard/time-widget";
import Link from 'next/link';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from "@/components/ui/button";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

export default function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/tasks`), orderBy('updatedAt', 'desc'), limit(10)) : null), [user, firestore]);
  const goalsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/goals`) : null), [user, firestore]);
  const habitsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/habits`) : null), [user, firestore]);
  const journalQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/journalEntries`), orderBy('createdAt', 'desc'), limit(3)) : null), [user, firestore]);

  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksQuery);
  const { data: goals, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery);
  const { data: habits, isLoading: loadingHabits } = useCollection<Habit>(habitsQuery);
  const { data: journalEntries, isLoading: loadingJournal } = useCollection<JournalEntry>(journalQuery);

  const isLoading = loadingTasks || loadingGoals || loadingHabits || loadingJournal;

  const tasksCompletedWeeklyData = useMemo(() => {
    if (!tasks) return [];
    const weekCounts = Array(7).fill(0).map((_, i) => ({
        name: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][i],
        completed: 0,
    }));

    tasks.forEach(task => {
        if (task.status === 'completed' && task.updatedAt) {
            const date = (task.updatedAt as Timestamp)?.toDate();
            if (date) {
                const dayOfWeek = date.getDay();
                weekCounts[dayOfWeek].completed++;
            }
        }
    });
    return weekCounts;
  }, [tasks]);

  const stats = {
    tasksCompleted: tasks?.filter(t => t.status === 'completed').length || 0,
    activeGoals: goals?.filter(g => (g.progress || 0) < 100).length || 0,
    activeHabits: habits?.length || 0,
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">لوحة التحكم</h2>
            <p className="text-muted-foreground">نظرة عامة على عالمك الشخصي.</p>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="h-full">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الوقت الحالي</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <TimeWidget/>
                 </CardContent>
            </Card>
        </motion.div>
        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المهام المنجزة (آخر 10)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.tasksCompleted}</div>
                </CardContent>
            </Card>
        </motion.div>
         <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الأهداف النشطة</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.activeGoals}</div>
                </CardContent>
            </Card>
        </motion.div>
         <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">العادات قيد التتبع</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.activeHabits}</div>
                </CardContent>
            </Card>
        </motion.div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants} className="lg:col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>الإنتاجية الأسبوعية</CardTitle>
                <CardDescription>عدد المهام التي أنجزتها خلال هذا الأسبوع.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                 <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={tasksCompletedWeeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                        <Bar dataKey="completed" fill="hsl(var(--primary))" name="المهام المنجزة" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
         </motion.div>
         <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants} className="lg:col-span-3">
             <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>آخر المذكرات</CardTitle>
                        <CardDescription>أحدث ما قمت بتدوينه.</CardDescription>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/dashboard/journal">
                             الكل <ArrowLeft className="mr-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                 {loadingJournal ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                 ) : journalEntries && journalEntries.length > 0 ? (
                    <div className="space-y-4">
                        {journalEntries.map(entry => (
                            <div key={entry.id} className="p-3 bg-muted/30 rounded-lg">
                                <h4 className="font-semibold truncate">{entry.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">{entry.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {(entry.createdAt as Timestamp)?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <p className="text-center text-muted-foreground py-10">لا توجد مذكرات بعد.</p>
                 )}
              </CardContent>
            </Card>
         </motion.div>
      </div>

    </div>
  );
}
