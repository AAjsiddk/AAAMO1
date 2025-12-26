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
import { collection, doc, serverTimestamp, query, writeBatch, addDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Trash2, Loader2, Inbox, GripVertical, Plus, Edit, Check, X, Pin, PinOff, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { StudyPlan } from '@/lib/types';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب' }),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed', 'not_completed']).default('pending'),
  progress: z.coerce.number().min(0).max(100).default(0),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});
type FormSchema = z.infer<typeof formSchema>;


export default function StudyPlannerPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<StudyPlan | null>(null);
  const [parentPlanId, setParentPlanId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', description: '', status: 'pending', progress: 0 },
  });

  const plansCollectionRef = useMemoFirebase(() => user ? collection(firestore, `users/${user.uid}/studyPlans`) : null, [user, firestore]);
  const { data: plans, isLoading } = useCollection<StudyPlan>(plansCollectionRef);

 const plansTree = useMemo(() => {
    if (!plans) return [];
    const planMap = new Map<string, StudyPlan & { subtasks: StudyPlan[] }>();
    const rootPlans: (StudyPlan & { subtasks: StudyPlan[] })[] = [];

    plans.forEach(p => planMap.set(p.id, { ...p, subtasks: [] }));
    plans.forEach(p => {
        const currentPlan = planMap.get(p.id);
        if (currentPlan) {
            if (p.parentId && planMap.has(p.parentId)) {
                const parent = planMap.get(p.parentId);
                if (parent) {
                  parent.subtasks.push(currentPlan);
                }
            } else {
                rootPlans.push(currentPlan);
            }
        }
    });

    const sortRecursively = (items: (StudyPlan & { subtasks: StudyPlan[] })[]) => {
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      items.forEach(item => {
        if (item.subtasks && item.subtasks.length > 0) sortRecursively(item.subtasks);
      });
    };
    sortRecursively(rootPlans);

    return rootPlans;
}, [plans]);

  const handleOpenDialog = (item: StudyPlan | null, parentId: string | null = null) => {
    setEditingItem(item);
    setParentPlanId(parentId);
    if(item) {
      form.reset({
        title: item.title,
        description: item.description || '',
        status: item.status,
        progress: item.progress || 0,
        startDate: item.startDate ? (item.startDate as Timestamp).toDate() : undefined,
        endDate: item.endDate ? (item.endDate as Timestamp).toDate() : undefined,
      });
    } else {
      form.reset({ title: '', description: '', status: 'pending', progress: 0, startDate: undefined, endDate: undefined });
    }
    setIsDialogOpen(true);
  };
  
  const handleStatusChange = async (planId: string, newStatus: StudyPlan['status']) => {
    if (!firestore || !user) return;
    const planRef = doc(firestore, `users/${user.uid}/studyPlans`, planId);
    const currentPlan = plans?.find(p => p.id === planId);
    if (!currentPlan) return;
    const finalStatus = currentPlan.status === newStatus ? 'pending' : newStatus;
    await updateDoc(planRef, { status: finalStatus });
  };
  
  const handleTogglePin = async (plan: StudyPlan) => {
    if (!firestore || !user) return;
    const planDocRef = doc(firestore, `users/${user.uid}/studyPlans`, plan.id);
    await updateDoc(planDocRef, { pinned: !plan.pinned });
  };
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || !plans || !firestore || !user) return;
    
    const batch = writeBatch(firestore);
    const docRef = doc(firestore, `users/${user.uid}/studyPlans`, draggableId);
    
    if (source.droppableId !== destination.droppableId) {
      batch.update(docRef, { parentId: destination.droppableId === 'root-droppable' ? null : destination.droppableId });
    }

    const list = plans.filter(p => (p.parentId || 'root-droppable') === destination.droppableId);
    const [movedItem] = list.splice(source.index, 1);
    list.splice(destination.index, 0, movedItem);

    list.forEach((item, index) => {
      const itemRef = doc(firestore, `users/${user.uid}/studyPlans`, item.id);
      batch.update(itemRef, { order: index });
    });

    await batch.commit().catch(e => {
        toast({variant: 'destructive', title: "Error reordering"});
        console.error(e);
    });
  };
  
  const handleDelete = async (planId: string) => {
    if(!user || !firestore || !plans) return;
    await deleteDoc(doc(firestore, `users/${user.uid}/studyPlans`, planId));
    toast({title: "تم حذف الخطة"});
  }

  const handleSubmit = async (values: FormSchema) => {
    if (!user || !plansCollectionRef) return;
    setIsSubmitting(true);
    try {
        const data = {
            ...values,
            userId: user.uid,
            createdAt: editingItem?.createdAt ?? serverTimestamp(),
            order: editingItem?.order ?? (plans?.length || 0),
            pinned: editingItem?.pinned ?? false,
            parentId: parentPlanId,
            startDate: values.startDate ? Timestamp.fromDate(values.startDate) : null,
            endDate: values.endDate ? Timestamp.fromDate(values.endDate) : null,
        };

        if (editingItem) {
            const planRef = doc(firestore, `users/${user.uid}/studyPlans`, editingItem.id);
            await updateDoc(planRef, data);
        } else {
            await addDoc(plansCollectionRef, data);
        }
        toast({ title: 'نجاح', description: 'تم حفظ الخطة.' });
        setIsDialogOpen(false);
        setEditingItem(null);
        setParentPlanId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل الحفظ.` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const StatusButtons = ({ item }: { item: StudyPlan }) => (
     <div className="flex gap-1 flex-shrink-0">
        <Button size="icon" variant={item.status === 'completed' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => handleStatusChange(item.id, 'completed')}><Check className="h-4 w-4" /></Button>
        <Button size="icon" variant={item.status === 'not_completed' ? 'destructive' : 'ghost'} className="h-8 w-8" onClick={() => handleStatusChange(item.id, 'not_completed')}><X className="h-4 w-4" /></Button>
    </div>
  );

  const PlanItem = ({ plan, index, level = 0 }: { plan: StudyPlan & { subtasks: StudyPlan[] }, index: number, level: number }) => (
    <Draggable key={plan.id} draggableId={plan.id} index={index}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps} className="my-2">
          <Card className={cn("relative", plan.pinned && "border-primary")}>
            <CardHeader {...provided.dragHandleProps} className="flex flex-row items-center justify-between p-3 cursor-grab bg-muted/30">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{plan.title}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <StatusButtons item={plan} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(null, plan.id)}><Plus className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePin(plan)}>{plan.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(plan, plan.parentId)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pl-8">
              {plan.description && <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>}
               {plan.progress !== undefined && (
                 <div className='my-2'>
                   <Progress value={plan.progress} className="h-2" />
                   <p className='text-xs text-muted-foreground mt-1'>{plan.progress}% مكتمل</p>
                 </div>
               )}
               <Droppable droppableId={plan.id} type="subtasks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="min-h-[10px]">
                      {plan.subtasks.map((subtask, subIndex) => (
                        <PlanItem key={subtask.id} plan={subtask} index={subIndex} level={level + 1} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
               </Droppable>
            </CardContent>
            {(plan.startDate || plan.endDate) && (
              <CardFooter className="p-3 text-xs text-muted-foreground">
                <CalendarIcon className="h-4 w-4 ml-2" />
                {plan.startDate ? format((plan.startDate as Timestamp).toDate(), 'P') : '...'} - {plan.endDate ? format((plan.endDate as Timestamp).toDate(), 'P') : '...'}
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </Draggable>
  );

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'تعديل الخطة' : (parentPlanId ? 'مهمة فرعية جديدة' : 'خطة جديدة')}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="مثال: كورس البرمجة" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>الوصف (اختياري)</FormLabel><FormControl><Textarea placeholder="تفاصيل الخطة" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="progress" render={({ field }) => (
              <FormItem><FormLabel>نسبة التقدم</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} value={field.value || 0} /></FormControl><Progress value={field.value || 0} className="mt-2" /><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>تاريخ البدء</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant='outline' className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>اختر تاريخ</span>}<CalendarIcon className="mr-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>تاريخ الانتهاء</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant='outline' className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>اختر تاريخ</span>}<CalendarIcon className="mr-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
            </div>
             <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">قيد الانتظار</SelectItem><SelectItem value="completed">مكتمل</SelectItem><SelectItem value="not_completed">لم يكتمل</SelectItem></SelectContent></Select><FormMessage /></FormItem>
             )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin ml-2" />} {editingItem ? 'حفظ' : 'إضافة'}</Button>
            </DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
      
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">مخطط الدراسة</h2>
          <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="ml-2 h-4 w-4" /> إضافة خطة</Button>
        </div>
        
        {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        : !plansTree || plansTree.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><Inbox className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-medium">لا توجد خطط بعد</h3><p className="mt-2 text-sm text-muted-foreground">ابدأ بإضافة أول خطة دراسية.</p></CardContent></Card>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="root-droppable" type="plans">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {plansTree.map((plan, index) => (
                      <PlanItem key={plan.id} plan={plan} index={index} level={0} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </>
  );
}
