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
import { collection, doc, serverTimestamp, query, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StickyNote, Send, Loader2, Trash2, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import type { Note } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const noteSchema = z.object({
  content: z.string().min(1, { message: 'لا يمكن حفظ ملاحظة فارغة.' }),
});

export default function NotesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: '' },
  });

  const notesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/notes`);
  }, [firestore, user]);

  const notesQuery = useMemoFirebase(() => {
    if (!notesCollectionRef) return null;
    return query(notesCollectionRef, orderBy('createdAt', 'desc'));
  }, [notesCollectionRef]);

  const { data: notes, isLoading } = useCollection<Note>(notesQuery);

  const handleSaveNote = async (values: z.infer<typeof noteSchema>) => {
    if (!notesCollectionRef || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(notesCollectionRef, {
        userId: user.uid,
        content: values.content,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'تم حفظ الملاحظة',
      });
      form.reset();
    } catch (error) {
      console.error("Error saving note:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ الملاحظة.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteNote = async (noteId: string) => {
    if (!firestore || !user) return;
    const noteDocRef = doc(firestore, `users/${user.uid}/notes`, noteId);
    try {
      await deleteDoc(noteDocRef);
      toast({ title: 'تم الحذف', description: 'تم حذف الملاحظة بنجاح.' });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الملاحظة.' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الملاحظات السريعة</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ملاحظة جديدة</CardTitle>
          <CardDescription>
            دوّن أفكارك وملاحظاتك بسرعة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSaveNote)} className="space-y-4">
            <div className="grid w-full gap-2">
              <Label htmlFor="note-content">ملاحظتك</Label>
              <Textarea
                id="note-content"
                placeholder="اكتب شيئًا..."
                {...form.register('content')}
                rows={4}
              />
              {form.formState.errors.content && <p className="text-sm font-medium text-destructive">{form.formState.errors.content.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
              حفظ الملاحظة
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>أرشيف الملاحظات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {!isLoading && (!notes || notes.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center border-2 border-dashed rounded-lg">
              <Inbox className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">لا توجد ملاحظات بعد</h3>
              <p className="text-muted-foreground">
                ملاحظاتك ستظهر هنا.
              </p>
            </div>
          ) : (
             <div className="space-y-4">
                {notes?.map(note => (
                  <Card key={note.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <p className="text-foreground whitespace-pre-wrap flex-1">{note.content}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {note.createdAt ? `${formatDistanceToNow( (note.createdAt as any).toDate(), { addSuffix: true, locale: ar })}` : 'الآن'}
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
