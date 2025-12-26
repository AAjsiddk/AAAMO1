'use client';
import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, writeBatch, addDoc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Loader2, Inbox, GripVertical, Plus, Edit, Check, X, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { StudyPlan, StudySubtask } from '@/lib/types';


const formSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب' }),
});

export default function StudyPlannerPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null);
  const [parentPlanId, setParentPlanId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '' },
  });

  // Firestore hooks
  const plansCollectionRef = useMemoFirebase(() => user ? collection(firestore, `users/${user.uid}/studyPlans`) : null, [user, firestore]);
  const plansQuery = useMemoFirebase(() => plansCollectionRef ? query(plansCollectionRef, orderBy('order')) : null, [plansCollectionRef]);
  const { data: plans, isLoading } = useCollection<StudyPlan>(plansQuery);

  const sortedPlans = useMemo(() => {
    if (!plans) return [];
    // Ensure subtasks are also sorted by their order property
    const sorted = [...plans].sort((a, b) => a.order - b.order);
    return sorted.map(plan => ({
        ...plan,
        subtasks: plan.subtasks ? [...plan.subtasks].sort((a,b) => a.order - b.order) : []
    }));
  }, [plans]);

  // Handlers
  const handleOpenDialog = (plan: StudyPlan | null) => {
    setEditingPlan(plan);
    form.reset({ title: plan ? plan.title : '' });
    setIsDialogOpen(true);
  };

  const handleOpenSubtaskDialog = (planId: string) => {
    setParentPlanId(planId);
    form.reset({ title: '' });
    setIsSubtaskDialogOpen(true);
  };
  
  const handleStatusChange = async (
    type: 'plan' | 'subtask', 
    ids: { planId: string; subtaskId?: string },
    newStatus: StudyPlan['status']
  ) => {
    if (!firestore || !user || !plans) return;
    const plan = plans.find(p => p.id === ids.planId);
    if (!plan) return;

    if (type === 'plan') {
      const planRef = doc(firestore, `users/${user.uid}/studyPlans`, ids.planId);
      await updateDoc(planRef, { status: newStatus });
    } else if (type === 'subtask' && ids.subtaskId) {
      const subtaskIndex = plan.subtasks.findIndex(st => st.id === ids.subtaskId);
      if (subtaskIndex === -1) return;
      
      const newSubtasks = [...plan.subtasks];
      newSubtasks[subtaskIndex].status = newStatus;
      
      const planRef = doc(firestore, `users/${user.uid}/studyPlans`, ids.planId);
      await updateDoc(planRef, { subtasks: newSubtasks });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !sortedPlans || !firestore || !user) return;

    const { source, destination, type } = result;
    
    if (type === 'plans') {
        const items = Array.from(sortedPlans);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        const batch = writeBatch(firestore);
        items.forEach((item, index) => {
            const docRef = doc(firestore, `users/${user.uid}/studyPlans`, item.id);
            batch.update(docRef, { order: index });
        });
        await batch.commit();
    } else if (type.startsWith('subtasks-')) {
        const planId = type.split('-')[1];
        const plan = sortedPlans.find(p => p.id === planId);
        if (!plan) return;

        const newSubtasks = Array.from(plan.subtasks);
        const [reorderedItem] = newSubtasks.splice(source.index, 1);
        newSubtasks.splice(destination.index, 0, reorderedItem);

        // Update order property for subtasks
        const updatedSubtasksWithOrder = newSubtasks.map((st, index) => ({...st, order: index}));

        const planRef = doc(firestore, `users/${user.uid}/studyPlans`, planId);
        await updateDoc(planRef, { subtasks: updatedSubtasksWithOrder });
    }
  };
  
  const handleDelete = async (planId: string, subtaskId?: string) => {
    if(!user || !firestore || !plans) return;
    
    if (subtaskId) {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;
        const newSubtasks = plan.subtasks.filter(st => st.id !== subtaskId);
        const planRef = doc(firestore, `users/${user.uid}/studyPlans`, planId);
        await updateDoc(planRef, { subtasks: newSubtasks });
        toast({title: "تم حذف المهمة الفرعية"});
    } else {
        const planRef = doc(firestore, `users/${user.uid}/studyPlans`, planId);
        await deleteDoc(planRef);
        toast({title: "تم حذف الخطة"});
    }
  }

  const handleSubmit = async (values: { title: string }) => {
    if (!user || !plansCollectionRef || !plans) return;
    setIsSubmitting(true);
    try {
      if (editingPlan) {
        // Edit existing plan
        const planRef = doc(firestore, `users/${user.uid}/studyPlans`, editingPlan.id);
        await updateDoc(planRef, { title: values.title });
        toast({ title: 'نجاح', description: 'تم تحديث الخطة.' });
      } else {
        // Add new plan
        await addDoc(plansCollectionRef, {
          title: values.title,
          status: 'pending',
          subtasks: [],
          order: plans.length || 0,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'نجاح', description: 'تمت إضافة الخطة.' });
      }
      setIsDialogOpen(false);
      setEditingPlan(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل الحفظ.` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubtaskSubmit = async (values: { title: string }) => {
    if (!user || !parentPlanId || !plans) return;
    const plan = plans.find(p => p.id === parentPlanId);
    if (!plan) return;
    
    setIsSubmitting(true);
    try {
        const newSubtask: StudySubtask = {
            id: doc(collection(firestore, 'tmp')).id,
            content: values.title,
            status: 'pending',
            order: plan.subtasks.length,
        };
        const newSubtasks = [...plan.subtasks, newSubtask];
        const planRef = doc(firestore, `users/${user.uid}/studyPlans`, parentPlanId);
        await updateDoc(planRef, { subtasks: newSubtasks });

        toast({title: 'نجاح', description: 'تمت إضافة المهمة الفرعية.'});
        setIsSubtaskDialogOpen(false);
        setParentPlanId(null);
    } catch (e) {
        toast({ variant: 'destructive', title: 'خطأ', description: `فشل إضافة المهمة.` });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const StatusButtons = ({ type, ids, currentStatus }: { type: 'plan' | 'subtask', ids: {planId: string, subtaskId?: string}, currentStatus: StudyPlan['status']}) => (
     <div className="flex gap-1 flex-shrink-0">
        <Button size="icon" variant={currentStatus === 'completed' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => handleStatusChange(type, ids, currentStatus === 'completed' ? 'pending' : 'completed')}><Check className="h-4 w-4" /></Button>
        <Button size="icon" variant={currentStatus === 'not_completed' ? 'destructive' : 'ghost'} className="h-8 w-8" onClick={() => handleStatusChange(type, ids, currentStatus === 'not_completed' ? 'pending' : 'not_completed')}><X className="h-4 w-4" /></Button>
    </div>
  );

  return (
    <>
      {/* Main Dialog for Plans */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPlan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>عنوان الخطة</FormLabel><FormControl><Input placeholder="مثال: كورس البرمجة" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin ml-2" />} {editingPlan ? 'حفظ' : 'إضافة'}</Button>
            </DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
      
       {/* Dialog for Subtasks */}
      <Dialog open={isSubtaskDialogOpen} onOpenChange={setIsSubtaskDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة مهمة فرعية</DialogTitle></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(handleSubtaskSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>عنوان المهمة</FormLabel><FormControl><Input placeholder="مثال: تعلم HTML" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin ml-2" />} إضافة</Button>
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
        : !sortedPlans || sortedPlans.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><Inbox className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-medium">لا توجد خطط بعد</h3><p className="mt-2 text-sm text-muted-foreground">ابدأ بإضافة أول خطة دراسية.</p></CardContent></Card>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="all-plans" type="plans">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {sortedPlans.map((plan, index) => (
                    <Draggable key={plan.id} draggableId={plan.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                           <Card>
                            <CardHeader {...provided.dragHandleProps} className="flex flex-row items-center justify-between p-4 cursor-grab bg-muted/30">
                               <div className="flex items-center gap-2">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  <CardTitle>{plan.title}</CardTitle>
                               </div>
                               <div className="flex items-center gap-1">
                                    <StatusButtons type="plan" ids={{ planId: plan.id }} currentStatus={plan.status} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenSubtaskDialog(plan.id)}><Plus className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(plan)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4" /></Button>
                               </div>
                            </CardHeader>
                            <CardContent className="p-4">
                               <Droppable droppableId={plan.id} type={`subtasks-${plan.id}`}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                        {plan.subtasks.map((subtask, subIndex) => (
                                             <Draggable key={subtask.id} draggableId={subtask.id} index={subIndex}>
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex items-center justify-between p-2 rounded-md bg-background border">
                                                        <div className="flex items-center gap-2">
                                                             <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                             <p>{subtask.content}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                             <StatusButtons type="subtask" ids={{ planId: plan.id, subtaskId: subtask.id }} currentStatus={subtask.status} />
                                                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(plan.id, subtask.id)}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                )}
                                             </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                               </Droppable>
                                {plan.subtasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد مهام فرعية. أضف واحدة!</p>}
                            </CardContent>
                           </Card>
                        </div>
                      )}
                    </Draggable>
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
