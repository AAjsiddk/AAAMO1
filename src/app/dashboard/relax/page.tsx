'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, query, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Loader2, PartyPopper, Inbox, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RelaxationActivity } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const activitySchema = z.object({
  name: z.string().min(1, { message: 'اسم النشاط مطلوب.' }),
  description: z.string().optional(),
  category: z.string().min(1, { message: 'الفئة مطلوبة.' }),
});

export default function RelaxationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingActivity, setEditingActivity] = useState<RelaxationActivity | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: { name: '', description: '', category: '' },
  });

  const activitiesCollectionRef = useMemoFirebase(() => user ? collection(firestore, `users/${user.uid}/relaxationActivities`) : null, [firestore, user]);
  const { data: activities, isLoading: isLoadingActivities } = useCollection<RelaxationActivity>(activitiesCollectionRef);

  const handleOpenDialog = (activity: RelaxationActivity | null) => {
    setEditingActivity(activity);
    if (activity) {
      form.reset({ name: activity.name, description: activity.description || '', category: activity.category });
    } else {
      form.reset({ name: '', description: '', category: '' });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof activitySchema>) => {
    if (!activitiesCollectionRef || !user) return;
    setIsSubmitting(true);
    try {
      if (editingActivity) {
        const docRef = doc(firestore, `users/${user.uid}/relaxationActivities`, editingActivity.id);
        await updateDoc(docRef, { ...values });
        toast({ title: 'نجاح', description: 'تم تحديث النشاط.' });
      } else {
        await addDoc(activitiesCollectionRef, { ...values, userId: user.uid, createdAt: serverTimestamp() });
        toast({ title: 'نجاح', description: 'تمت إضافة النشاط بنجاح.' });
      }
      form.reset();
      setIsDialogOpen(false);
      setEditingActivity(null);
    } catch (error) {
      console.error("Error saving activity: ", error);
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل إنشاء النشاط.` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteActivity = async (activityId: string) => {
    if (!firestore || !user) return;
    const activityDocRef = doc(firestore, `users/${user.uid}/relaxationActivities`, activityId);
    try {
      await deleteDoc(activityDocRef);
      toast({ title: 'تم الحذف', description: 'تم حذف النشاط بنجاح.' });
    } catch (error) {
      console.error("Error deleting activity: ", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف النشاط.'});
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">مخطط الدراسة</h2>
        <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="ml-2 h-4 w-4" /> إضافة نشاط جديد</Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{editingActivity ? 'تعديل النشاط' : 'نشاط ترفيهي جديد'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم النشاط</FormLabel><FormControl><Input placeholder="مثال: الخروج مع الأصدقاء" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>الفئة</FormLabel><FormControl><Input placeholder="مثال: اجتماعي, رياضي, سفر" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>وصف (اختياري)</FormLabel><FormControl><Textarea placeholder="صف النشاط أو خطط له" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting && (<Loader2 className="ml-2 h-4 w-4 animate-spin" />)} {editingActivity ? 'حفظ التعديلات' : 'حفظ النشاط'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {isLoadingActivities && (<div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>)}
      {!isLoadingActivities && (!activities || activities.length === 0) && (
        <Card><CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Inbox className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">لا توجد أنشطة بعد</h3>
          <p className="text-muted-foreground max-w-md">ابدأ بإضافة نشاط تستمتع به أو خروجة تخطط لها.</p>
          <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="ml-2 h-4 w-4" /> إضافة نشاط جديد</Button>
        </CardContent></Card>
      )}
      {!isLoadingActivities && activities && activities.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{activity.name}</span>
                  <div className="flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(activity)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle><AlertDialogDescription>هذا الإجراء لا يمكن التراجع عنه. سيتم حذف هذا النشاط بشكل دائم.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteActivity(activity.id)}>متابعة</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
                <CardDescription>{activity.category}</CardDescription>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{activity.description}</p></CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
