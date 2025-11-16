'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Loader2, CheckCircle, Target } from 'lucide-react';
import { useCollection, useUser, useMemoFirebase } from '@/firebase'
import { useFirestore } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { Task, Goal, Habit } from '@/lib/types'

export default function AchievementsPage() {
  const { user } = useUser()
  const firestore = useFirestore()

  const tasksQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/tasks`) : null), [user, firestore])
  const goalsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/goals`) : null), [user, firestore])

  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksQuery);
  const { data: goals, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery);
  
  const isLoading = loadingTasks || loadingGoals;

  const completedTasksCount = tasks?.filter(t => t.status === 'completed').length || 0;
  const completedGoalsCount = goals?.filter(g => g.progress === 100).length || 0;

  const getTrophy = (count: number) => {
    if (count >= 100) return "🏆";
    if (count >= 50) return "🥇";
    if (count >= 25) return "🥈";
    if (count >= 10) return "🥉";
    return "-";
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الإنجازات والتحديات</h2>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>سجل إنجازاتك</CardTitle>
            <CardDescription>
                هنا يتم عرض ملخص لإنجازاتك والميداليات التي حصلت عليها.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                 <div className="grid md:grid-cols-2 gap-4 text-center">
                    <Card className="bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold"><CheckCircle className="text-green-500" /> المهام المكتملة</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-6xl font-bold">{completedTasksCount}</p>
                            <div className="flex flex-col items-center">
                                <p className="text-4xl">{getTrophy(completedTasksCount)}</p>
                                <p className="text-sm text-muted-foreground mt-1">ميدالية المهام</p>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="bg-card">
                        <CardHeader>
                             <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold"><Target className="text-red-500"/> الأهداف المحققة</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-6xl font-bold">{completedGoalsCount}</p>
                             <div className="flex flex-col items-center">
                                <p className="text-4xl">{getTrophy(completedGoalsCount)}</p>
                                <p className="text-sm text-muted-foreground mt-1">ميدالية الأهداف</p>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            )}
        </CardContent>
      </Card>
       <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">التحديات قيد التطوير</h3>
          <p className="text-muted-foreground max-w-md">
            قريبًا... سيتم إضافة تحديات مخصصة وربطها بالأهداف والعادات لمنحك شارات عند تحقيقها.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
