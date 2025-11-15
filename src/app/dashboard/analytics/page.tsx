'use client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { useCollection, useUser, useMemoFirebase } from '@/firebase'
import type { Task } from '@/lib/types'
import { collection } from 'firebase/firestore'
import { useFirestore } from '@/firebase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

const statusTranslations: { [key in Task['status']]: string } = {
  pending: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  deferred: 'مؤجلة',
  cancelled: 'ملغاة',
  waiting_for: 'في انتظار طرف آخر',
  archived: 'مؤرشفة',
};


export default function AnalyticsPage() {
  const { user } = useUser()
  const firestore = useFirestore()

  const tasksQuery = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/tasks`) : null),
    [user, firestore]
  )
 
  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksQuery)

  const taskStatusData = useMemo(() => {
    if (!tasks) return []
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    return Object.entries(statusCounts).map(([status, value]) => ({
      name: statusTranslations[status as Task['status']] || status,
      value,
    }))
  }, [tasks])

  const tasksCompletedWeeklyData = useMemo(() => {
    if (!tasks) return [];
    const weekCounts = Array(7).fill(0).map((_, i) => ({
        name: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][i],
        completed: 0,
    }));

    tasks.forEach(task => {
        if (task.status === 'completed' && task.updatedAt && typeof (task.updatedAt as any).toDate === 'function') {
            const completedDate = (task.updatedAt as any).toDate();
            const dayOfWeek = completedDate.getDay();
            weekCounts[dayOfWeek].completed++;
        }
    });
    return weekCounts;
  }, [tasks])


  const isLoading = loadingTasks

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">التحليلات</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>توزيع حالات المهام</CardTitle>
             <CardDescription>
                نظرة شاملة على كيفية توزيع مهامك الحالية.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} مهمة`}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>المهام المنجزة هذا الأسبوع</CardTitle>
             <CardDescription>
                نظرة على إنتاجيتك خلال الأيام السبعة الماضية.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={350}>
                <BarChart data={tasksCompletedWeeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#82ca9d" name="المهام المنجزة" />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
