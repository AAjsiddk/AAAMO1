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
  addDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp, query } from 'firebase/firestore';
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
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  PlusCircle,
  CalendarIcon,
  Trash2,
  Loader2,
  Inbox,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';

const taskSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب.' }),
  description: z.string().optional(),
  status: z.enum([
    'pending',
    'in_progress',
    'completed',
    'deferred',
    'cancelled',
    'waiting_for',
    'archived',
  ]),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export default function TasksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'pending',
    },
  });

  const tasksCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/tasks`);
  }, [firestore, user]);

  const tasksQuery = useMemoFirebase(() => {
    if (!tasksCollectionRef) return null;
    return query(tasksCollectionRef);
  }, [tasksCollectionRef]);

  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksQuery);

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    if (!firestore || !user || !tasksCollectionRef) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لا يمكن إنشاء المهمة. المستخدم غير مسجل.',
      });
      return;
    }
    setIsSubmitting(true);

    const newTask: Omit<Task, 'id'> = {
      ...values,
      userId: user.uid,
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(tasksCollectionRef, newTask);
    
    toast({
      title: 'نجاح',
      description: 'تمت إضافة المهمة بنجاح.',
    });

    setIsSubmitting(false);
    setIsDialogOpen(false);
    form.reset();
  };
  
  const handleDeleteTask = (taskId: string) => {
    if (!firestore || !user) return;
    const taskDocRef = doc(firestore, `users/${user.uid}/tasks`, taskId);
    deleteDocumentNonBlocking(taskDocRef);
    toast({
      title: 'تم الحذف',
      description: 'تم حذف المهمة بنجاح.',
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">المهام</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة مهمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>مهمة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان</FormLabel>
                      <FormControl>
                        <Input placeholder="عنوان المهمة" {...field} />
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
                        <Textarea placeholder="وصف قصير للمهمة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        dir="rtl"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                          <SelectItem value="completed">مكتملة</SelectItem>
                          <SelectItem value="deferred">مؤجلة</SelectItem>
                          <SelectItem value="cancelled">ملغاة</SelectItem>
                          <SelectItem value="waiting_for">في انتظار طرف آخر</SelectItem>
                          <SelectItem value="archived">مؤرشفة</SelectItem>
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
                    حفظ المهمة
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingTasks && (
         <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      )}

      {!isLoadingTasks && (!tasks || tasks.length === 0) && (
         <Card>
           <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">لا توجد مهام بعد</h3>
              <p className="text-muted-foreground">
                ابدأ بإضافة مهمتك الأولى لتنظيم يومك.
              </p>
           </CardContent>
         </Card>
      )}

      {!isLoadingTasks && tasks && tasks.length > 0 && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                   <span className='w-full'>{task.title}</span>
                   <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteTask(task.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                   </Button>
                </CardTitle>
                <CardDescription>{task.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="text-sm text-muted-foreground space-y-2">
                  <div className='flex items-center gap-2'>
                    <span className="font-semibold">الحالة:</span>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                       {task.status}
                    </span>
                  </div>
                   {(task.startDate || task.endDate) && (
                     <div className="flex items-center gap-2 pt-2">
                       <CalendarIcon className="h-4 w-4" />
                       <span>
                         {task.startDate
                           ? format(new Date(task.startDate.seconds * 1000), 'dd/MM/yy')
                           : '...'}
                       </span>
                       <span>-</span>
                       <span>
                         {task.endDate
                           ? format(new Date(task.endDate.seconds * 1000), 'dd/MM/yy')
                           : '...'}
                       </span>
                     </div>
                   )}
                 </div>
              </CardContent>
            </Card>
          ))}
         </div>
      )}
    </div>
  );
}
