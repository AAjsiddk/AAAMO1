'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, addDoc, deleteDoc, updateDoc, Timestamp, writeBatch, getDocs, type FieldValue } from 'firebase/firestore';
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
  Edit,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
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

const taskSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب.' }),
  description: z.string().optional().default(''),
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
  parentId: z.string().nullable().optional(),
});

const statusTranslations: { [key in Task['status']]: string } = {
  pending: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  deferred: 'مؤجلة',
  cancelled: 'ملغاة',
  waiting_for: 'في انتظار طرف آخر',
  archived: 'مؤرشفة',
};

const statusColors: { [key in Task['status']]: string } = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  deferred: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  waiting_for: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  archived: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};


function TaskItem({ task, level = 0, onEdit, onDelete, onAddSubtask }: { task: Task; level?: number; onEdit: (task: Task) => void; onDelete: (taskId: string) => void; onAddSubtask: (parentId: string) => void; }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const getSafeDate = (date: any) => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    return null;
  }

  const startDate = getSafeDate(task.startDate);
  const endDate = getSafeDate(task.endDate);

  return (
    <div style={{ paddingRight: level > 0 ? '1.5rem' : '0' }} className="relative">
       {level > 0 && <span className="absolute right-[10px] top-0 bottom-0 w-0.5 bg-border -z-10"></span>}
      <Card className={cn("mb-2", task.status === 'completed' && 'bg-muted/50')}>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-grow min-w-0">
               {task.subtasks && task.subtasks.length > 0 && (
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
               {level > 0 && task.subtasks?.length === 0 && <div className="w-6" />}
               {level > 0 && !task.subtasks && <div className="w-6" />}
              <CardTitle className={cn("text-lg font-semibold truncate", task.status === 'completed' && 'line-through text-muted-foreground')}>
                {task.title}
              </CardTitle>
            </div>
            <div className="flex items-center flex-shrink-0">
               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAddSubtask(task.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
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
                    <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                    <AlertDialogDescription>
                       سيتم حذف هذه المهمة وجميع المهام الفرعية التابعة لها بشكل دائم.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(task.id)}>متابعة</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          {task.description && <CardDescription className="pt-2 pl-8">{task.description}</CardDescription>}
        </CardHeader>
        {(task.status || startDate || endDate) &&
            <CardFooter className="p-4 pt-0 pl-8">
               <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <div className='flex items-center gap-2'>
                    <Badge variant="outline" className={cn("font-normal", statusColors[task.status])}>
                       {statusTranslations[task.status]}
                    </Badge>
                  </div>
                  {(startDate || endDate) && (
                     <div className="flex items-center gap-2">
                       <CalendarIcon className="h-4 w-4" />
                       <span>
                         {startDate ? format(startDate, 'dd/MM/yy') : '...'}
                       </span>
                       <span>-</span>
                       <span>
                         {endDate ? format(endDate, 'dd/MM/yy') : '...'}
                       </span>
                     </div>
                  )}
                </div>
            </CardFooter>
        }
      </Card>
      {isExpanded && task.subtasks && (
         <div className="pr-1">
          {task.subtasks.map(subtask => (
            <TaskItem key={subtask.id} task={subtask} level={level + 1} onEdit={onEdit} onDelete={onDelete} onAddSubtask={onAddSubtask} />
          ))}
        </div>
      )}
    </div>
  );
}


export default function TasksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<string | null>(null);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', status: 'pending', parentId: null },
  });

  const tasksCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/tasks`);
  }, [firestore, user]);

  const { data: allTasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksCollectionRef);
  
  const tasksTree = useMemo(() => {
    if (!allTasks) return [];
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    allTasks.forEach(task => {
        taskMap.set(task.id, { ...task, subtasks: [] });
    });

    allTasks.forEach(task => {
        const currentTask = taskMap.get(task.id);
        if (currentTask) {
            if (task.parentId && taskMap.has(task.parentId)) {
                const parent = taskMap.get(task.parentId);
                parent?.subtasks?.push(currentTask);
            } else {
                rootTasks.push(currentTask);
            }
        }
    });

    return rootTasks;
  }, [allTasks]);


  const handleDialogOpen = (task: Task | null, parentId: string | null = null) => {
    setEditingTask(task);
    setParentTask(parentId);
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        startDate: task.startDate ? (task.startDate as Timestamp).toDate() : undefined,
        endDate: task.endDate ? (task.endDate as Timestamp).toDate() : undefined,
        parentId: task.parentId
      });
    } else {
      form.reset({
        title: '',
        description: '',
        status: 'pending',
        startDate: undefined,
        endDate: undefined,
        parentId: parentId,
      });
    }
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
    setParentTask(null);
  }

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    if (!firestore || !user || !tasksCollectionRef) return;
    setIsSubmitting(true);
    
    try {
        const taskData: Omit<Task, 'id' | 'subtasks' | 'updatedAt'> & { updatedAt: FieldValue } = {
            userId: user.uid,
            updatedAt: serverTimestamp(),
            title: values.title,
            description: values.description,
            status: values.status,
            startDate: values.startDate || null,
            endDate: values.endDate || null,
            parentId: values.parentId || null,
        };

        if (editingTask) {
            const taskDocRef = doc(firestore, `users/${user.uid}/tasks`, editingTask.id);
            await updateDoc(taskDocRef, {
              ...taskData,
              startDate: values.startDate || null,
              endDate: values.endDate || null,
            });
            toast({ title: 'نجاح', description: 'تم تحديث المهمة بنجاح.' });
        } else {
            await addDoc(tasksCollectionRef, {
              ...taskData,
              startDate: values.startDate || null,
              endDate: values.endDate || null,
            });
            toast({ title: 'نجاح', description: 'تمت إضافة المهمة بنجاح.' });
        }
        
        handleDialogClose();
    } catch(error) {
        console.error("Error creating task: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: `فشل ${editingTask ? 'تحديث' : 'إنشاء'} المهمة.` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!firestore || !user || !allTasks) return;
    
    const tasksToDelete = new Set<string>([taskId]);
    const tasksToCheck = [taskId];
    
    // Find all subtasks recursively
    while (tasksToCheck.length > 0) {
      const currentTaskId = tasksToCheck.pop()!;
      const subtasks = allTasks.filter(t => t.parentId === currentTaskId);
      subtasks.forEach(sub => {
        tasksToDelete.add(sub.id);
        tasksToCheck.push(sub.id);
      });
    }

    try {
        const batch = writeBatch(firestore);
        tasksToDelete.forEach(id => {
            const taskDocRef = doc(firestore, `users/${user.uid}/tasks`, id);
            batch.delete(taskDocRef);
        });
        await batch.commit();

        toast({ title: 'تم الحذف', description: 'تم حذف المهمة وجميع المهام الفرعية بنجاح.' });
    } catch (error) {
        console.error("Error deleting task: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف المهمة.' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">المهام</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) handleDialogClose()}}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogOpen(null)}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة مهمة رئيسية
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'تعديل المهمة' : (parentTask ? 'مهمة فرعية جديدة' : 'مهمة جديدة')}</DialogTitle>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl" >
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
                                className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                              >
                                {field.value ? (format(field.value, 'PPP')) : (<span>اختر تاريخ</span>)}
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
                                {field.value ? (format(field.value, 'PPP')) : (<span>اختر تاريخ</span>)}
                                <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" onClick={handleDialogClose}>إلغاء</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (<Loader2 className="ml-2 h-4 w-4 animate-spin" />)}
                    {editingTask ? 'حفظ التعديلات' : 'حفظ المهمة'}
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

      {!isLoadingTasks && (!tasksTree || tasksTree.length === 0) && (
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

      {!isLoadingTasks && tasksTree && tasksTree.length > 0 && (
         <div className="space-y-2">
          {tasksTree.map((task) => (
            <TaskItem key={task.id} task={task} level={0} onEdit={handleDialogOpen} onDelete={handleDeleteTask} onAddSubtask={(parentId) => handleDialogOpen(null, parentId)} />
          ))}
         </div>
      )}
    </div>
  );
}
