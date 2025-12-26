'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2, Edit, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


type BeautifulMoment = {
    id: string;
    content: string;
    createdAt: Timestamp;
}

const momentSchema = z.object({
  content: z.string().min(1, 'المحتوى مطلوب.'),
});

export default function BeautifulDayPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingMoment, setEditingMoment] = useState<BeautifulMoment | null>(null);

  const form = useForm<z.infer<typeof momentSchema>>({
    resolver: zodResolver(momentSchema),
    defaultValues: { content: '' },
  });

  const journalCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/journalEntries`);
  }, [user, firestore]);

  const entriesQuery = useMemoFirebase(() => {
    if (!journalCollectionRef) return null;
    return query(journalCollectionRef, orderBy('createdAt', 'desc'));
  }, [journalCollectionRef]);

  const { data: allEntries, isLoading } = useCollection<any>(entriesQuery);

  const beautifulMoments = useMemo(() => {
    if (!allEntries) return [];
    return allEntries
      .filter(entry => entry.title === 'My Beautiful Moment' || entry.title === 'لحظة سعيدة')
      .map(entry => {
        if (!entry.createdAt) return null; // Guard against null createdAt
        return {
          id: entry.id,
          content: entry.content,
          createdAt: entry.createdAt,
        } as BeautifulMoment;
      })
      .filter((moment): moment is BeautifulMoment => moment !== null);
  }, [allEntries]);
  
  const handleDelete = async (momentId: string) => {
    if (!user) return;
    const docRef = doc(firestore, `users/${user.uid}/journalEntries`, momentId);
    try {
      await deleteDoc(docRef);
      toast({ title: 'نجاح', description: 'تم حذف اللحظة.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف اللحظة.' });
    }
  };

  const handleOpenEditDialog = (moment: BeautifulMoment) => {
    setEditingMoment(moment);
    form.reset({ content: moment.content });
  };
  
  const handleEditSubmit = async (values: z.infer<typeof momentSchema>) => {
    if (!user || !editingMoment) return;
    const docRef = doc(firestore, `users/${user.uid}/journalEntries`, editingMoment.id);
    try {
      await updateDoc(docRef, { content: values.content, updatedAt: serverTimestamp() });
      toast({ title: 'نجاح', description: 'تم تحديث اللحظة.' });
      setEditingMoment(null);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث اللحظة.' });
    }
  };

  return (
    <>
     <Dialog open={!!editingMoment} onOpenChange={(isOpen) => !isOpen && setEditingMoment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل اللحظة الجميلة</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>المحتوى</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                <Button type="submit">حفظ التعديلات</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">يومي الجميل</h2>
        </div>
        <Card>
          <CardHeader>
              <CardTitle>سجل اللحظات الإيجابية</CardTitle>
              <CardDescription>
                  هذا القسم سيعرض اللحظات السعيدة التي تسجلها كل يوم لبناء عادة التفكير الإيجابي. 
                  يمكنك إضافتها من خلال أيقونة "الحالة المزاجية" في الشريط العلوي.
              </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {!isLoading && beautifulMoments.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
                <Sparkles className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">لم تسجل أي لحظات جميلة بعد</h3>
                <p className="text-muted-foreground max-w-md">
                  استخدم زر الحالة المزاجية في الأعلى لتدوين أول لحظة إيجابية في يومك.
                </p>
              </div>
            ) : (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                   {beautifulMoments.map(moment => (
                      <Card key={moment.id} className="bg-secondary/50 border-primary/20 hover:shadow-lg transition-shadow group relative">
                          <CardContent className="p-4">
                               <p className="font-medium text-secondary-foreground">"{moment.content}"</p>
                               <p className="text-xs text-muted-foreground mt-2">{moment.createdAt?.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </CardContent>
                          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditDialog(moment)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(moment.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                      </Card>
                   ))}
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
