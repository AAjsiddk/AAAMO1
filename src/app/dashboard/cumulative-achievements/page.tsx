'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useCollection, useUser, useMemoFirebase } from '@/firebase'
import { useFirestore } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { Task, Goal, Habit } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';


export default function CumulativeAchievementsPage() {
  const { user } = useUser()
  const firestore = useFirestore()

  const tasksQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/tasks`) : null), [user, firestore])
  const goalsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/goals`) : null), [user, firestore])
  const habitsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/habits`) : null), [user, firestore])

  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksQuery);
  const { data: goals, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery);
  const { data: habits, isLoading: loadingHabits } = useCollection<Habit>(habitsQuery);

  const isLoading = loadingTasks || loadingGoals || loadingHabits;

  const chartData = useMemo(() => {
    return [
      { name: 'المهام المنجزة', value: tasks?.filter(t => t.status === 'completed').length || 0 },
      { name: 'الأهداف المحققة', value: goals?.filter(g => g.progress === 100).length || 0 },
      { name: 'العادات المكتسبة', value: habits?.filter(h => h.type === 'acquire').length || 0 },
    ];
  }, [tasks, goals, habits]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الإنجاز التراكمي</h2>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>نظرة شاملة على تقدمك</CardTitle>
            <CardDescription>
                هذا القسم يعرض مدى تقدمك العام في جميع جوانب حياتك بناءً على بياناتك في الأهداف والعادات والمشاريع.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-4 text-center">
            {isLoading ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin"/>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="الإجمالي" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
