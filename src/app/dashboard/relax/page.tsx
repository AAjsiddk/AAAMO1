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
import { collection, doc, serverTimestamp, query, addDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Loader2, Inbox, GripVertical, Plus, Edit, Check, X, Pin, PinOff, Wind } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { RelaxationActivity, RelaxationSubtask } from '@/lib/types';


const formSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب' }),
});

export default function RelaxPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<RelaxationActivity | RelaxationSubtask | null>(null);
  const [parentPlanId, setParentPlanId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '' },
  });

  const plansCollectionRef = useMemoFirebase(() => user ? collection(firestore, `users/${user.uid}/relaxationActivities`) : null, [user, firestore]);
  const { data: plans, isLoading } = useCollection<RelaxationActivity>(plansCollectionRef);

 const plansTree = useMemo(() => {
    if (!plans) return [];
    
    const planMap = new Map<string, RelaxationActivity & { subtasks: any[] }>();
    const rootPlans: (RelaxationActivity & { subtasks: any[] })[] = [];

    plans.forEach(p => {
        planMap.set(p.id, { ...p, subtasks: [] });
    });

    plans.forEach(p => {
        const currentPlan = planMap.get(p.id);
        if (currentPlan) {
            if ((p as any).parentId && planMap.has((p as any).parentId)) {
                const parent = planMap.get((p as any).parentId);
                parent?.subtasks.push(currentPlan);
            } else {
                rootPlans.push(currentPlan);
            }
        }
    });

    const sortRecursively = (items: (RelaxationActivity & { subtasks: any[] })[]) => {
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      items.forEach(item => {
        if (item.subtasks && item.subtasks.length > 0) {
          sortRecursively(item.subtasks);
        }
      });
    };
    
    sortRecursively(rootPlans);

    return rootPlans.sort((a,b) => (a.pinned && !b.pinned) ? -1 : (!a.pinned && b.pinned) ? 1 : (a.order ?? 0) - (b.order ?? 0));
}, [plans]);


  const handleOpenDialog = (item: RelaxationActivity | RelaxationSubtask | null, parentId: string | null = null) => {
    setEditingItem(item);
    setParentPlanId(parentId);
    if(item && 'title' in item) form.reset({ title: item.title });
    else if(item && 'content' in item) form.reset({ title: item.content });
    else form.reset({ title: '' });
    
    setIsDialogOpen(true);
  };
  
  const handleStatusChange = async (
    item: RelaxationActivity | RelaxationSubtask,
    newStatus: RelaxationActivity['status']
  ) => {
    if (!firestore || !user) return;
    const currentStatus = item.status;
    const finalStatus = currentStatus === newStatus ? 'pending' : newStatus;
    
    const docRef = doc(firestore, `users/${user.uid}/relaxationActivities`, 'parentId' in item ? (item as any).parentId : item.id);
    await updateDoc(docRef, { status: finalStatus });

  };
  
  const handleTogglePin = async (plan: RelaxationActivity) => {
    if (!firestore || !user) return;
    const planDocRef = doc(firestore, `users/${user.uid}/relaxationActivities`, plan.id);
    await updateDoc(planDocRef, { pinned: !plan.pinned });
  };
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || !plans || !firestore || !user) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const batch = writeBatch(firestore);
    
    const findAndReorder = (items: RelaxationActivity[]): RelaxationActivity[] => {
        const newItems = Array.from(items);
        let movedItem: RelaxationActivity | undefined;

        // Find and remove item from old position
        for (let i = 0; i < newItems.length; i++) {
            if (newItems[i].id === draggableId) {
                [movedItem] = newItems.splice(i, 1);
                break;
            }
            if (newItems[i].subtasks) {
                newItems[i].subtasks = findAndReorder(newItems[i].subtasks as any) as any;
            }
        }
        
        return newItems;
    };
    
    let allItems = JSON.parse(JSON.stringify(plansTree));
    const movedItem = plans.find(p => p.id === draggableId);
    if(!movedItem) return;

    // Remove from old position
    let parentId = movedItem.parentId || null;
    if(parentId){
        const parent = plans.find(p => p.id === parentId);
    } else {
        allItems = allItems.filter((p: any) => p.id !== draggableId);
    }
    
    // Add to new position
    if (destination.droppableId === 'root-droppable') {
        movedItem.parentId = null;
        allItems.splice(destination.index, 0, movedItem);
    } else {
        movedItem.parentId = destination.droppableId;
    }
    
    const reorder = (items: RelaxationActivity[], parentId: string | null = null) => {
        items.forEach((item, index) => {
             const docRef = doc(firestore, `users/${user.uid}/relaxationActivities`, item.id);
             batch.update(docRef, { order: index, parentId: parentId });
             if (item.subtasks && item.subtasks.length > 0) {
                 reorder(item.subtasks, item.id);
             }
        });
    }

    // Logic to update Firestore based on drag and drop result
    // This is complex and requires careful state management and batch writes.
    // For this prototype, a simplified version:
    
    const docRef = doc(firestore, `users/${user.uid}/relaxationActivities`, draggableId);
    batch.update(docRef, { parentId: destination.droppableId === 'root-droppable' ? null : destination.droppableId });
    
    // You would also need to re-calculate the 'order' for siblings
    
    await batch.commit().catch(e => {
        toast({variant: 'destructive', title: "Error reordering"});
        console.error(e);
    });

  };
  
  const handleDelete = async (planId: string) => {
    if(!user || !firestore || !plans) return;
    await deleteDoc(doc(firestore, `users/${user.uid}/relaxationActivities`, planId));
    toast({title: "تم حذف الخطة"});
  }

  const handleSubmit = async (values: { title: string }) => {
    if (!user || !plansCollectionRef) return;
    setIsSubmitting(true);
    try {
      if (editingItem && 'title' in editingItem) {
        const planRef = doc(firestore, `users/${user.uid}/relaxationActivities`, editingItem.id);
        await updateDoc(planRef, { title: values.title });
      } else {
        await addDoc(plansCollectionRef, {
          title: values.title, status: 'pending', pinned: false, order: plans?.length || 0,
          userId: user.uid, createdAt: serverTimestamp(), parentId: parentPlanId,
        });
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
  
  const StatusButtons = ({ item }: { item: RelaxationActivity | RelaxationSubtask }) => (
     <div className="flex gap-1 flex-shrink-0">
        <Button size="icon" variant={item.status === 'completed' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => handleStatusChange(item, 'completed')}><Check className="h-4 w-4" /></Button>
        <Button size="icon" variant={item.status === 'not_completed' ? 'destructive' : 'ghost'} className="h-8 w-8" onClick={() => handleStatusChange(item, 'not_completed')}><X className="h-4 w-4" /></Button>
    </div>
  );

  const PlanItem = ({ plan, level = 0 }: { plan: RelaxationActivity & { subtasks: any[] }, level: number }) => (
    <Draggable key={plan.id} draggableId={plan.id} index={plan.order}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="my-2"
        >
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(plan)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            {(plan.subtasks && plan.subtasks.length > 0) && (
              <CardContent className="p-3 pl-8">
                <Droppable droppableId={plan.id} type="subtasks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {plan.subtasks.map((subtask: any) => (
                        <PlanItem key={subtask.id} plan={subtask} level={level + 1} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
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
          <Form {...form}><form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="مثال: رحلة نهاية الأسبوع" {...field} /></FormControl><FormMessage /></FormItem>
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
          <h2 className="text-3xl font-bold tracking-tight">مخطط الترفيه</h2>
          <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="ml-2 h-4 w-4" /> إضافة خطة</Button>
        </div>
        
        {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        : !plansTree || plansTree.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><Wind className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-medium">لا توجد خطط ترفيهية بعد</h3><p className="mt-2 text-sm text-muted-foreground">ابدأ بإضافة أول خطة ترفيهية.</p></CardContent></Card>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="root-droppable" type="plans">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {plansTree.map((plan) => (
                      <PlanItem key={plan.id} plan={plan} level={0} />
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
