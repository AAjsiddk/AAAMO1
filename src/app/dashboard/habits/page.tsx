'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Trash2, Loader2, Repeat, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Habit, HabitMark } from '@/lib/types';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { subYears, format } from 'date-fns';

const habitSchema = z.object({
  name: z.string().min(1, { message: 'اسم العادة مطلوب.' }),
  type: z.enum(['acquire', 'quit']),
});

function HabitCard({ habit, onDelete }: { habit: Habit, onDelete: (habitId: string) => void }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [heatmapValues, setHeatmapValues] = useState<{ date: string; count: number }[]>([]);
  const [streak, setStreak] = useState(0);

  const habitMarksRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/habits/${habit.id}/marks`);
  }, [firestore, user, habit.id]);

  const { data: marks, isLoading: isLoadingMarks } = useCollection<HabitMark>(habitMarksRef);

  useEffect(() => {
    if (marks) {
      const values = marks.map(mark => ({
        date: format(mark.date.toDate(), 'yyyy-MM-dd'),
        count: mark.completed ? 1 : 0,
      }));
      setHeatmapValues(values);
      calculateStreak(values);
    }
  }, [marks]);
  
  const calculateStreak = (values: { date: string; count: number }[]) => {
      const sortedDates = values
        .filter(v => v.count > 0)
        .map(v => new Date(v.date))
        .sort((a, b) => b.getTime() - a.getTime());

      if (sortedDates.length === 0) {
        setStreak(0);
        return;
      }
      
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const latestDate = new Date(sortedDates[0]);
      latestDate.setHours(0,0,0,0);

      // Check if the streak is current
      if (latestDate.getTime() === today.getTime() || latestDate.getTime() === yesterday.getTime()) {
        currentStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const currentDate = new Date(sortedDates[i]);
          const previousDate = new Date(sortedDates[i+1]);
          const diffTime = currentDate.getTime() - previousDate.getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);

          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      setStreak(currentStreak);
  }

  const handleDayClick = async (value: { date: string; count: number } | null) => {
    if (!value || !firestore || !user) return;
    
    const { date } = value;
    const markDate = new Date(date);
    
    const existingMark = marks?.find(m => format(m.date.toDate(), 'yyyy-MM-dd') === date);
    
    if (existingMark) {
      const markDocRef = doc(firestore, `users/${user.uid}/habits/${habit.id}/marks`, existingMark.id);
      await deleteDocumentNonBlocking(markDocRef);
    } else {
      const markId = `${habit.id}_${date}`;
      const newMark: Omit<HabitMark, 'id'> = {
          habitId: habit.id,
          userId: user.uid,
          date: markDate,
          completed: true,
      };
      const markDocRef = doc(firestore, `users/${user.uid}/habits/${habit.id}/marks`, markId);
      await setDocumentNonBlocking(markDocRef, newMark, {});
    }
  };

  const today = new Date();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="w-full">{habit.name}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onDelete(habit.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardTitle>
        <CardDescription>
          النوع: {habit.type === 'acquire' ? 'اكتساب' : 'ترك'} | سلسلة النجاح: {streak} {streak > 2 ? 'أيام' : 'يوم'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div dir="ltr">
         <CalendarHeatmap
            startDate={subYears(today, 1)}
            endDate={today}
            values={heatmapValues}
            classForValue={(value) => {
              if (!value) {
                return 'color-empty';
              }
              return `color-scale-${value.count}`;
            }}
            tooltipDataAttrs={(value: { date: string, count: number }) => {
                if(!value || !value.date) return null;
                return {
                    'data-tooltip-id': 'heatmap-tooltip',
                    'data-tooltip-content': `${format(new Date(value.date), 'yyyy-MM-dd')}: ${value.count > 0 ? 'مكتمل' : 'غير مكتمل'}`,
                };
            }}
            onClick={handleDayClick}
          />
          <ReactTooltip id="heatmap-tooltip" />
        </div>
      </CardContent>
    </Card>
  )
}


export default function HabitsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof habitSchema>>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      type: 'acquire',
    },
  });

  const habitsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/habits`);
  }, [firestore, user]);

  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsCollectionRef);

  const onSubmit = async (values: z.infer<typeof habitSchema>) => {
    if (!firestore || !user || !habitsCollectionRef) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لا يمكن إنشاء العادة. المستخدم غير مسجل.',
      });
      return;
    }
    setIsSubmitting(true);

    const newHabit: Omit<Habit, 'id'> = {
      ...values,
      userId: user.uid,
      streak: 0,
    };

    await addDocumentNonBlocking(habitsCollectionRef, newHabit);
    
    toast({
      title: 'نجاح',
      description: 'تمت إضافة العادة بنجاح.',
    });

    setIsSubmitting(false);
    setIsDialogOpen(false);
    form.reset();
  };
  
  const handleDeleteHabit = async (habitId: string) => {
    if (!firestore || !user) return;
    
    // First, delete all marks in the subcollection
    const marksQuery = query(collection(firestore, `users/${user.uid}/habits/${habitId}/marks`));
    const marksSnapshot = await getDocs(marksQuery);
    const batch = writeBatch(firestore);
    marksSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Then, delete the habit document itself
    const habitDocRef = doc(firestore, `users/${user.uid}/habits`, habitId);
    await deleteDocumentNonBlocking(habitDocRef);
    
    toast({
      title: 'تم الحذف',
      description: 'تم حذف العادة وكل سجلاتها بنجاح.',
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">العادات</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة عادة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>عادة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العادة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: القراءة لمدة 15 دقيقة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>النوع</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        dir="rtl"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="acquire">اكتساب عادة</SelectItem>
                          <SelectItem value="quit">ترك عادة</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      إلغاء
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    حفظ العادة
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingHabits && (
         <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      )}

      {!isLoadingHabits && (!habits || habits.length === 0) && (
         <Card>
           <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">لا توجد عادات بعد</h3>
              <p className="text-muted-foreground">
                ابدأ بإضافة عادتك الأولى لتتبع تقدمك.
              </p>
           </CardContent>
         </Card>
      )}

      {!isLoadingHabits && habits && habits.length > 0 && (
         <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onDelete={handleDeleteHabit} />
          ))}
         </div>
      )}
    </div>
  );
}
