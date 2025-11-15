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
import { collection, doc, serverTimestamp, query, orderBy, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Send, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// This uses JournalEntry type for simplicity
type GratitudeItem = {
  id: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
};

const gratitudeSchema = z.object({
  content: z.string().min(3, { message: 'اكتب شيئًا تشعر بالامتنان تجاهه.' }),
});

export default function GratitudePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof gratitudeSchema>>({
    resolver: zodResolver(gratitudeSchema),
    defaultValues: { content: '' },
  });

  // Re-using journalEntries collection for gratitude for simplicity, prefixed with "Gratitude: "
  const journalCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/journalEntries`);
  }, [firestore, user]);
  
  const entriesQuery = useMemoFirebase(() => {
    if (!journalCollectionRef) return null;
    return query(journalCollectionRef, orderBy('createdAt', 'desc'));
  }, [journalCollectionRef]);

  const { data: allEntries, isLoading } = useCollection<any>(entriesQuery);

  const gratitudeItems = useMemo(() => {
    return allEntries?.filter(entry => entry.title === 'Gratitude Entry').map(entry => ({
      id: entry.id,
      userId: entry.userId,
      content: entry.content,
      createdAt: entry.createdAt,
    } as GratitudeItem)) || [];
  }, [allEntries]);


  const handleSaveGratitude = async (values: z.infer<typeof gratitudeSchema>) => {
    if (!journalCollectionRef || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(journalCollectionRef, {
        userId: user.uid,
        title: 'Gratitude Entry', // To distinguish from normal journal entries
        content: values.content,
        mood: 'happy',
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'تم الحفظ',
        description: 'تمت إضافة شعورك بالامتنان إلى صندوقك.',
      });
      form.reset();
    } catch (error) {
      console.error("Error saving gratitude:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ الامتنان.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteGratitude = async (entryId: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, `users/${user.uid}/journalEntries`, entryId);
    try {
      await deleteDoc(docRef);
      toast({ title: 'تم الحذف', description: 'تم حذف عنصر الامتنان.' });
    } catch (error) {
      console.error("Error deleting gratitude:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف العنصر.' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">صندوق الامتنان</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>أنا ممتن لـ...</CardTitle>
          <CardDescription>
            سجل نعمة أو شيئًا جميلًا في يومك لتعزيز التفكير الإيجابي.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSaveGratitude)} className="space-y-4">
            <div className="grid w-full gap-2">
              <Label htmlFor="gratitude-content">اكتب ما أنت ممتن له اليوم</Label>
              <Textarea
                id="gratitude-content"
                placeholder="أنا ممتن لـ..."
                {...form.register('content')}
                rows={4}
              />
              {form.formState.errors.content && <p className="text-sm font-medium text-destructive">{form.formState.errors.content.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Heart className="ml-2 h-4 w-4" />}
              أضف إلى الصندوق
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>محتويات صندوق الامتنان</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {!isLoading && gratitudeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center border-2 border-dashed rounded-lg">
              <Heart className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">صندوقك فارغ</h3>
              <p className="text-muted-foreground">
                ابدأ بتسجيل أول شيء تشعر بالامتنان تجاهه.
              </p>
            </div>
          ) : (
             <div className="space-y-4">
                {gratitudeItems.map(item => (
                  <Card key={item.id} className="bg-primary/10 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <p className="text-foreground whitespace-pre-wrap flex-1">{item.content}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteGratitude(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                       <p className="text-xs text-muted-foreground mt-2">
                        {item.createdAt ? format(item.createdAt.toDate(), 'PPP', { locale: ar }) : ''}
                      </p>
                    </CardContent>
                  </Card>
                ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
