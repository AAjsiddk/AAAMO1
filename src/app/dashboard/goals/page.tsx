'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, addDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  PlusCircle,
  CalendarIcon,
  Trash2,
  Loader2,
  Inbox,
  Lock,
  Unlock,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Goal } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const goalSchema = z.object({
  name: z.string().min(1, { message: 'اسم الهدف مطلوب.' }),
  description: z.string().optional().default(''),
  motivation: z.string().optional().default(''),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  password: z.string().optional().default(''),
  progress: z.coerce.number().min(0).max(100).optional().default(0),
});


function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: (goal: Goal) => void; onDelete: (goalId: string) => void }) {
    const [isLocked, setIsLocked] = useState(!!goal.passwordHash);
    const [password, setPassword] = useState('');
    const {toast} = useToast();
    
    const handleUnlock = () => {
        // In a real app, you would verify the password against the hash.
        // This requires a backend function. For this prototype, we'll just check for non-empty.
        if (password === goal.passwordHash) { // Simple check for prototype
            setIsLocked(false);
            toast({title: "تم الفتح", description: "تم فتح الهدف بنجاح."})
        } else {
             toast({variant: "destructive", title: "خطأ", description: "كلمة المرور غير صحيحة."})
        }
    }
    
    const getSafeDate = (date: any) => {
        if (!date) return null;
        if (date instanceof Date) return date;
        if (date instanceof Timestamp) return date.toDate();
        return null;
    }

    const startDate = getSafeDate(goal.startDate);
    const endDate = getSafeDate(goal.endDate);

    return (
        <Card className="flex flex-col">
          {isLocked ? (
              <div className="flex flex-col items-center justify-center flex-grow p-6">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">هذا الهدف مقفول</p>
                <div className="flex w-full max-w-sm items-center space-x-2 mt-4" dir="ltr">
                  <Input 
                    type="password" 
                    placeholder="كلمة المرور" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-right"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock() }}
                  />
                  <Button onClick={handleUnlock}>فتح</Button>
                </div>
              </div>
          ) : (
           <>
            <CardHeader>
              <CardTitle className="flex justify-between items-start gap-2">
                <span className='flex-grow'>{goal.name}</span>
                <div className="flex items-center flex-shrink-0">
                    {goal.passwordHash && (
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsLocked(true); setPassword(''); } }>
                           <Lock className="h-4 w-4" />
                         </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(goal)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            هذا الإجراء لا يمكن التراجع عنه. سيتم حذف هذا الهدف بشكل دائم وجميع بياناته المرتبطة به.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(goal.id)}>متابعة</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardTitle>
              <CardDescription>{goal.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              {goal.motivation && (
                <blockquote className="border-r-2 border-primary pr-4 italic text-muted-foreground">
                  {goal.motivation}
                </blockquote>
              )}
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold">التقدم</span>
                    <span>{goal.progress || 0}%</span>
                 </div>
                 <Progress value={goal.progress || 0} />
              </div>
            </CardContent>
            {(startDate || endDate) &&
                <CardFooter>
                     <div className="text-sm text-muted-foreground flex items-center gap-2">
                       <CalendarIcon className="h-4 w-4" />
                       <span>
                         {startDate
                           ? format(startDate, 'dd/MM/yy')
                           : '...'}
                       </span>
                       <span>-</span>
                       <span>
                         {endDate
                           ? format(endDate, 'dd/MM/yy')
                           : '...'}
                       </span>
                     </div>
                </CardFooter>
            }
           </>
          )}
        </Card>
    )
}


export default function GoalsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      description: '',
      motivation: '',
      password: '',
      progress: 0,
    },
  });

  const goalsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/goals`);
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!goalsCollectionRef) return null;
    return query(goalsCollectionRef);
  }, [goalsCollectionRef]);

  const { data: goals, isLoading: isLoadingGoals } = useCollection<Goal>(goalsQuery);

  const handleDialogOpen = (goal: Goal | null) => {
    setEditingGoal(goal);
    if (goal) {
      form.reset({
        name: goal.name,
        description: goal.description || '',
        motivation: goal.motivation || '',
        startDate: goal.startDate ? (goal.startDate as Timestamp).toDate() : undefined,
        endDate: goal.endDate ? (goal.endDate as Timestamp).toDate() : undefined,
        progress: goal.progress || 0,
        password: '', // Don't expose password hash
      });
    } else {
      form.reset({
        name: '',
        description: '',
        motivation: '',
        password: '',
        progress: 0,
        startDate: undefined,
        endDate: undefined,
      });
    }
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
  };

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    if (!firestore || !user || !goalsCollectionRef) return;
    setIsSubmitting(true);

    try {
        const goalData: Omit<Goal, 'id' | 'updatedAt'> & { updatedAt: FieldValue } = {
            userId: user.uid,
            updatedAt: serverTimestamp(),
            name: values.name,
            description: values.description || '',
            motivation: values.motivation || '',
            progress: values.progress || 0,
            startDate: values.startDate || null,
            endDate: values.endDate || null,
            passwordHash: values.password ? values.password : (editingGoal?.passwordHash || null), // In real app, hash this
        };

        if (editingGoal) {
            const goalDocRef = doc(firestore, `users/${user.uid}/goals`, editingGoal.id);
            // Only update passwordHash if a new password is provided
            if (values.password) {
                goalData.passwordHash = values.password; // In a real app, hash this
            } else {
                goalData.passwordHash = editingGoal.passwordHash || null;
            }
            await updateDoc(goalDocRef, goalData);
            toast({ title: 'نجاح', description: 'تم تحديث الهدف بنجاح.' });
        } else {
             if (values.password) {
                goalData.passwordHash = values.password; // In a real app, hash this
            }
            await addDoc(goalsCollectionRef, goalData);
            toast({ title: 'نجاح', description: 'تمت إضافة الهدف بنجاح.' });
        }
        
        handleDialogClose();
    } catch (error) {
        console.error("Error saving goal: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: `فشل ${editingGoal ? 'تحديث' : 'إنشاء'} الهدف.` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteGoal = async (goalId: string) => {
    if (!firestore || !user) return;
    const goalDocRef = doc(firestore, `users/${user.uid}/goals`, goalId);
    try {
        await deleteDoc(goalDocRef);
        toast({
          title: 'تم الحذف',
          description: 'تم حذف الهدف بنجاح.',
        });
    } catch (error) {
        console.error("Error deleting goal: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الهدف.'});
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الأهداف</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleDialogClose() }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogOpen(null)}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة هدف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'تعديل الهدف' : 'هدف جديد'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الهدف</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: تعلم لغة جديدة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="صف هدفك" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motivation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدافع (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="لماذا تريد تحقيق هذا الهدف؟" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التقدم</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} />
                      </FormControl>
                       <Progress value={field.value} className="mt-2" />
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
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>اختر تاريخ</span>
                                )}
                                <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
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
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>اختر تاريخ</span>
                                )}
                                <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة مرور (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={editingGoal ? "اتركه فارغًا لعدم التغيير" : "لقفل الهدف"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" onClick={handleDialogClose}>
                      إلغاء
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    {editingGoal ? 'حفظ التعديلات' : 'حفظ الهدف'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingGoals && (
         <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      )}

      {!isLoadingGoals && (!goals || goals.length === 0) && (
         <Card>
           <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Inbox className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">لا توجد أهداف بعد</h3>
              <p className="text-muted-foreground max-w-md">
                ابدأ بإضافة هدفك الأول لتتبع طموحاتك وتحقيق أحلامك.
              </p>
               <Button onClick={() => handleDialogOpen(null)}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  إضافة هدف جديد
               </Button>
           </CardContent>
         </Card>
      )}

      {!isLoadingGoals && goals && goals.length > 0 && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={handleDialogOpen} onDelete={handleDeleteGoal} />
          ))}
         </div>
      )}
    </div>
  );
}
