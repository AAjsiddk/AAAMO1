'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import type { Task, Goal } from '@/lib/types';
import { collection, Timestamp } from 'firebase/firestore';
import { format, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, Target, ClipboardCheck, Info } from 'lucide-react';
import type { DayProps } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type CalendarEvent = {
    id: string;
    title: string;
    type: 'task' | 'goal';
    date: Date;
    status?: Task['status'];
};

const statusTranslations: { [key in Task['status']]: string } = {
  pending: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  deferred: 'مؤجلة',
  cancelled: 'ملغاة',
  waiting_for: 'في انتظار طرف آخر',
  archived: 'مؤرشفة',
};


export default function CalendarPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const tasksQuery = useMemoFirebase(() => 
        user ? collection(firestore, `users/${user.uid}/tasks`) : null
    , [user, firestore]);

    const goalsQuery = useMemoFirebase(() =>
        user ? collection(firestore, `users/${user.uid}/goals`) : null
    , [user, firestore]);

    const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
    const { data: goals, isLoading: goalsLoading } = useCollection<Goal>(goalsQuery);
    
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        if (tasks) {
            tasks.forEach(task => {
                const date = task.endDate ? (task.endDate as Timestamp).toDate() : null;
                if (date) {
                    const dateString = format(date, 'yyyy-MM-dd');
                    if (!map.has(dateString)) map.set(dateString, []);
                    map.get(dateString)?.push({ id: task.id, title: task.title, type: 'task', date, status: task.status });
                }
            });
        }
        if (goals) {
             goals.forEach(goal => {
                const date = goal.endDate ? (goal.endDate as Timestamp).toDate() : null;
                 if (date) {
                    const dateString = format(date, 'yyyy-MM-dd');
                    if (!map.has(dateString)) map.set(dateString, []);
                    map.get(dateString)?.push({ id: goal.id, title: goal.name, type: 'goal', date });
                }
            });
        }
        return map;
    }, [tasks, goals]);

    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        return eventsByDate.get(dateString) || [];
    }, [selectedDate, eventsByDate]);
    
    const DayWithTasks = (dayProps: DayProps) => {
        const { date, modifiers } = dayProps;
        const eventsForDay = eventsByDate.get(format(date, 'yyyy-MM-dd'));
        
        const buttonProps: React.HTMLAttributes<HTMLButtonElement> = { ...dayProps };
        delete (buttonProps as any).displayMonth;
        delete (buttonProps as any).date;
        delete (buttonProps as any).modifiers;
        
        return (
             <div className="relative">
                <Button 
                    name="day"
                    {...buttonProps}
                    variant={modifiers?.selected ? 'default' : modifiers?.today ? 'outline' : 'ghost'} 
                    className={cn(
                        'h-9 w-9 p-0 font-normal',
                        !modifiers?.disabled && modifiers?.outside && 'text-muted-foreground opacity-50'
                    )}
                 >
                    {date.getDate()}
                 </Button>
                {eventsForDay && eventsForDay.length > 0 && (
                     <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1 pointer-events-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                     </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">التقويم المتكامل (الزمن الذكي)</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardContent className="p-2 md:p-4">
                        <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="w-full"
                            locale={ar}
                            components={{ Day: DayWithTasks }}
                        />
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle className="text-lg">
                           أحداث يوم {selectedDate ? format(selectedDate, 'd MMMM', { locale: ar }) : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                         <ScrollArea className="h-96">
                        {tasksLoading || goalsLoading ? (
                             <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                             </div>
                        ) : selectedDayEvents.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDayEvents.map(event => (
                                    <div key={event.id} className="p-3 bg-muted rounded-md flex items-start gap-3">
                                        <div className="mt-1">
                                            {event.type === 'task' ? <ClipboardCheck className="h-5 w-5 text-primary" /> : <Target className="h-5 w-5 text-primary" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{event.title}</p>
                                             {event.type === 'task' && event.status && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {statusTranslations[event.status] || event.status}
                                                </Badge>
                                             )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="flex flex-col text-center items-center justify-center h-full text-muted-foreground p-8">
                                <Info className="h-8 w-8 mb-2" />
                                <p>
                                    لا توجد مهام أو أهداف مجدولة لهذا اليوم.
                                </p>
                            </div>
                        )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
