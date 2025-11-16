'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import type { Task } from '@/lib/types';
import { collection, Timestamp } from 'firebase/firestore';
import { format, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { DayPicker, DayProps } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const tasksQuery = useMemoFirebase(() => 
        user ? collection(firestore, `users/${user.uid}/tasks`) : null
    , [user, firestore]);

    const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
    
    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();
        if (!tasks) return map;

        tasks.forEach(task => {
            if (task.endDate) {
                const date = (task.endDate as Timestamp).toDate();
                const dateString = format(date, 'yyyy-MM-dd');
                if (!map.has(dateString)) {
                    map.set(dateString, []);
                }
                map.get(dateString)?.push(task);
            }
        });
        return map;
    }, [tasks]);

    const selectedDayTasks = useMemo(() => {
        if (!selectedDate) return [];
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        return tasksByDate.get(dateString) || [];
    }, [selectedDate, tasksByDate]);
    
    const DayWithTasks = (dayProps: DayProps) => {
        const { date } = dayProps;
        const tasksForDay = tasksByDate.get(format(date, 'yyyy-MM-dd'));
        const modifiers = dayProps.modifiers || {};
        
        // Remove props that are not valid for DOM elements
        const buttonProps: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string | undefined, disabled?: boolean | undefined } = {
            ...dayProps,
            children: undefined, 
        };
        
        delete (buttonProps as any).displayMonth;
        delete (buttonProps as any).date;
        delete (buttonProps as any).modifiers;
        
        return (
             <div className="relative">
                <Button 
                    {...buttonProps}
                    name="day"
                    variant={modifiers.selected ? 'default' : modifiers.today ? 'outline' : 'ghost'} 
                    className={cn(
                        'h-9 w-9 p-0 font-normal',
                        !modifiers.disabled && modifiers.outside && 'text-muted-foreground opacity-50'
                    )}
                 >
                    {dayProps.date.getDate()}
                 </Button>
                {tasksForDay && tasksForDay.length > 0 && (
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
                            components={{
                                Day: DayWithTasks
                            }}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-4">
                           مهام {selectedDate ? format(selectedDate, 'd MMMM', { locale: ar }) : 'اليوم'}
                        </h3>
                        {tasksLoading ? (
                             <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                             </div>
                        ) : selectedDayTasks.length > 0 ? (
                            <div className="space-y-2">
                                {selectedDayTasks.map(task => (
                                    <div key={task.id} className="p-3 bg-muted rounded-md">
                                        <p className="font-medium">{task.title}</p>
                                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                                            {task.status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                لا توجد مهام مجدولة لهذا اليوم.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
