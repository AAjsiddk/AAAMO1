'use client';
import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, addDoc, deleteDoc, updateDoc, writeBatch, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Send, Loader2, Trash2, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import type { Inspiration } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const inspirationSchema = z.object({
  content: z.string().min(1, { message: 'لا يمكن حفظ إلهام فارغ.' }),
});

export default function InspirationsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof inspirationSchema>>({
    resolver: zodResolver(inspirationSchema),
    defaultValues: { content: '' },
  });

  const inspirationsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/inspirations`);
  }, [firestore, user]);
  
  const inspirationsQuery = useMemoFirebase(() => {
    if (!inspirationsCollectionRef) return null;
    return query(inspirationsCollectionRef, orderBy('createdAt', 'desc'));
  }, [inspirationsCollectionRef]);

  const { data: inspirations, isLoading } = useCollection<Inspiration>(inspirationsQuery);

  const handleSaveInspiration = async (values: z.infer<typeof inspirationSchema>) => {
    if (!inspirationsCollectionRef || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(inspirationsCollectionRef, {
        userId: user.uid,
        content: values.content,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'تم حفظ الإلهام',
      });
      form.reset();
    } catch (error) {
      console.error("Error saving inspiration:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ الإلهام.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteInspiration = async (inspirationId: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, `users/${user.uid}/inspirations`, inspirationId);
    try {
      await deleteDoc(docRef);
      toast({ title: 'تم الحذف', description: 'تم حذف الإلهام بنجاح.' });
    } catch (error) {
      console.error("Error deleting inspiration:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الإلهام.' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">صندوق الإلهام</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>فكرة جديدة؟</CardTitle>
          <CardDescription>
            دوّن الأفكار السريعة والخواطر قبل أن تفلت منك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSaveInspiration)} className="space-y-4">
            <div className="grid w-full gap-2">
              <Label htmlFor="inspiration-content">إلهامك</Label>
              <Textarea
                id="inspiration-content"
                placeholder="ما الذي يدور في ذهنك؟"
                {...form.register('content')}
                rows={4}
              />
              {form.formState.errors.content && <p className="text-sm font-medium text-destructive">{form.formState.errors.content.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
              حفظ الإلهام
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <CardHeader>
          <CardTitle>أرشيف الإلهامات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {!isLoading && (!inspirations || inspirations.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center border-2 border-dashed rounded-lg">
              <Inbox className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">صندوقك فارغ</h3>
              <p className="text-muted-foreground">
                إلهاماتك وأفكارك السريعة ستظهر هنا.
              </p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inspirations?.map(item => (
                  <Card key={item.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <p className="text-foreground whitespace-pre-wrap flex-1">{item.content}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteInspiration(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                       <p className="text-xs text-muted-foreground mt-2">
                        {item.createdAt ? `${formatDistanceToNow( (item.createdAt as any).toDate(), { addSuffix: true, locale: ar })}` : 'الآن'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
             </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}
