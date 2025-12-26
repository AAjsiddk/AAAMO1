'use client';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, where, getDocs, writeBatch, addDoc, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Trash2, Loader2, Edit, Inbox, CalendarIcon, Check, X, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Habit, HabitMark } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';

const habitSchema = z.object({
  name: z.string().min(1, { message: 'اسم العادة مطلوب.' }),
  type: z.enum(['acquire', 'quit']),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.date({ required_error: "تاريخ البدء مطلوب." }),
  endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب." }),
});

function HabitDayTracker({ habit }: { habit: Habit }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const marksQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, `users/${user.uid}/habits/${habit.id}/marks`));
    }, [firestore, user, habit.id]);

    const { data: marks, isLoading } = useCollection<HabitMark>(marksQuery);

    const handleMarkUpdate = async (date: Date, status: HabitMark['status']) => {
        if (!firestore || !user) return;
        const dateString = format(date, 'yyyy-MM-dd');
        const markId = `${habit.id}_${dateString}`;
        const markRef = doc(firestore, `users/${user.uid}/habits/${habit.id}/marks`, markId);
        
        const existingMark = marks?.find(m => m.date === dateString);

        try {
            if (existingMark && existingMark.status === status) {
                 await deleteDoc(markRef);
            } else {
                 const newMark: Omit<HabitMark, 'id'> = {
                    habitId: habit.id,
                    userId: user.uid,
                    date: dateString,
                    status: status,
                 };
                 await setDoc(markRef, newMark);
            }
        } catch (e) {
            console.error("Error updating habit mark:", e);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث حالة اليوم.' });
        }
    };
    
    const days = useMemo(() => {
        if (!habit.startDate || !habit.endDate) return [];
        return eachDayOfInterval({
            start: (habit.startDate as Timestamp).toDate(),
            end: (habit.endDate as Timestamp).toDate(),
        });
    }, [habit.startDate, habit.endDate]);

    const marksMap = useMemo(() => {
        if (!marks) return new Map<string, HabitMark['status']>();
        return new Map(marks.map(mark => [mark.date, mark.status]));
    }, [marks]);
    
    if (!habit.startDate || !habit.endDate) {
        return <div className="p-2 text-center text-sm text-muted-foreground">الرجاء تحديد تاريخ البدء والانتهاء.</div>;
    }

    return (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {isLoading ? <Loader2 className="animate-spin" /> : days.map(day => {
                const dateString = format(day, 'yyyy-MM-dd');
                const currentStatus = marksMap.get(dateString);

                return (
                    <div key={dateString} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span className="text-sm font-medium">{format(day, 'EEEE, d MMMM yyyy')}</span>
                        <div className="flex gap-1">
                            <Button 
                                size="icon" 
                                variant={currentStatus === 'completed' ? 'default' : 'ghost'} 
                                className="h-8 w-8"
                                onClick={() => handleMarkUpdate(day, 'completed')}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant={currentStatus === 'not_completed' ? 'destructive' : 'ghost'} 
                                className="h-8 w-8"
                                onClick={() => handleMarkUpdate(day, 'not_completed')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant={currentStatus === 'partially_completed' ? 'secondary' : 'ghost'} 
                                className="h-8 w-8"
                                onClick={() => handleMarkUpdate(day, 'partially_completed')}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

function HabitCard({ habit, onEdit, onDelete }: { habit: Habit; onEdit: (habit: Habit) => void; onDelete: (habitId: string) => void }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="w-full">{habit.name}</span>
          <div className="flex-shrink-0 flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(habit)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(habit.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          النوع: {habit.type === 'acquire' ? 'اكتساب' : 'ترك'} | التكرار: {habit.frequency === 'daily' ? 'يومي' : habit.frequency === 'weekly' ? 'أسبوعي' : 'شهري'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <HabitDayTracker habit={habit} />
      </CardContent>
    </Card>
  )
}

export default function HabitsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof habitSchema>>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      type: 'acquire',
      frequency: 'daily',
    }
  });
  
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset({ name: '', type: 'acquire', frequency: 'daily', startDate: undefined, endDate: undefined });
      setEditingHabit(null);
    }
  }, [isDialogOpen, form]);

  const habitsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/habits`);
  }, [firestore, user]);

  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsCollectionRef);

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    form.reset({
      name: habit.name,
      type: habit.type,
      frequency: habit.frequency || 'daily',
      startDate: habit.startDate ? (habit.startDate as Timestamp).toDate() : new Date(),
      endDate: habit.endDate ? (habit.endDate as Timestamp).toDate() : new Date(),
    });
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const onSubmit = async (values: z.infer<typeof habitSchema>) => {
    if (!firestore || !user || !habitsCollectionRef) return;
    setIsSubmitting(true);

    try {
      const habitData = {
          ...values,
          userId: user.uid,
          startDate: Timestamp.fromDate(values.startDate),
          endDate: Timestamp.fromDate(values.endDate)
      };

      if (editingHabit) {
        const habitDocRef = doc(firestore, `users/${user.uid}/habits`, editingHabit.id);
        await updateDoc(habitDocRef, habitData);
        toast({ title: 'نجاح', description: 'تم تحديث العادة بنجاح.' });
      } else {
        await addDoc(habitsCollectionRef, habitData);
        toast({ title: 'نجاح', description: 'تمت إضافة العادة بنجاح.' });
      }
      handleDialogClose();
    } catch(error) {
       console.error("Error saving habit: ", error);
       toast({ variant: 'destructive', title: 'خطأ', description: `فشل ${editingHabit ? 'تحديث' : 'إنشاء'} العادة.` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteHabit = async (habitId: string) => {
    if (!firestore || !user) return;
    
    try {
      const marksQuery = query(collection(firestore, `users/${user.uid}/habits/${habitId}/marks`));
      const marksSnapshot = await getDocs(marksQuery);
      const batch = writeBatch(firestore);
      marksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      const habitDocRef = doc(firestore, `users/${user.uid}/habits`, habitId);
      batch.delete(habitDocRef);

      await batch.commit();
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف العادة وكل سجلاتها بنجاح.',
      });
    } catch (error) {
       console.error("Error deleting habit: ", error);
       toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف العادة.' });
    }
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
              <DialogTitle>{editingHabit ? 'تعديل عادة' : 'عادة جديدة'}</DialogTitle>
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
                 <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التكرار</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        dir="rtl"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر التكرار" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">يومي</SelectItem>
                          <SelectItem value="weekly">أسبوعي</SelectItem>
                          <SelectItem value="monthly">شهري</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>تاريخ البدء</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>اختر تاريخ</span>}
                                <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>تاريخ الانتهاء</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>اختر تاريخ</span>}
                                <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                    {editingHabit ? 'حفظ التعديلات' : 'حفظ العادة'}
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
            <HabitCard key={habit.id} habit={habit} onEdit={openEditDialog} onDelete={handleDeleteHabit} />
          ))}
         </div>
      )}
    </div>
  );
}
