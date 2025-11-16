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
import { collection, doc, serverTimestamp, query, orderBy, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Loader2, StickyNote, Edit, Pin, PinOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/types';


const noteSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب.' }),
  content: z.string().min(1, { message: 'المحتوى مطلوب.' }),
});

export default function NotesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: '', content: '' },
  });

  const notesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/notes`);
  }, [firestore, user]);

  const notesQuery = useMemoFirebase(() => {
    if (!notesCollectionRef) return null;
    return query(notesCollectionRef, orderBy('pinned', 'desc'), orderBy('createdAt', 'desc'));
  }, [notesCollectionRef]);

  const { data: notes, isLoading } = useCollection<Note>(notesQuery);

  const handleOpenDialog = (note: Note | null = null) => {
    setEditingNote(note);
    if (note) {
        form.reset({ title: note.title, content: note.content });
    } else {
        form.reset({ title: '', content: '' });
    }
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
      setIsDialogOpen(false);
      setEditingNote(null);
  };

  const onSubmit = async (values: z.infer<typeof noteSchema>) => {
    if (!notesCollectionRef || !user) return;
    setIsSubmitting(true);
    
    try {
        if(editingNote) {
             const noteDocRef = doc(firestore, `users/${user.uid}/notes`, editingNote.id);
             await updateDoc(noteDocRef, { ...values });
             toast({ title: 'نجاح', description: 'تم تحديث الملاحظة.' });
        } else {
             await addDoc(notesCollectionRef, {
                ...values,
                userId: user.uid,
                pinned: false,
                color: 'default',
                createdAt: serverTimestamp(),
            });
            toast({ title: 'نجاح', description: 'تمت إضافة الملاحظة.' });
        }
      handleDialogClose();
    } catch (error) {
      console.error("Error saving note:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل حفظ الملاحظة.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!notesCollectionRef) return;
    try {
      await deleteDoc(doc(notesCollectionRef, noteId));
      toast({ title: 'تم الحذف', description: 'تم حذف الملاحظة بنجاح.' });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الملاحظة." });
    }
  };
  
  const handlePinNote = async (note: Note) => {
      if (!firestore || !user) return;
      const noteDocRef = doc(firestore, `users/${user.uid}/notes`, note.id);
      try {
          await updateDoc(noteDocRef, { pinned: !note.pinned });
          toast({ title: 'نجاح', description: note.pinned ? 'تم إلغاء تثبيت الملاحظة.' : 'تم تثبيت الملاحظة.' });
      } catch(error) {
           console.error("Error pinning note:", error);
           toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة التثبيت." });
      }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الملاحظات</h2>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="ml-2 h-4 w-4" />
              ملاحظة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>{editingNote ? 'تعديل ملاحظة' : 'ملاحظة جديدة'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField name="title" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="عنوان الملاحظة" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="content" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>المحتوى</FormLabel><FormControl><Textarea placeholder="اكتب ملاحظاتك هنا..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    {editingNote ? 'حفظ التعديلات' : 'حفظ'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!notes || notes.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <StickyNote className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">لا توجد ملاحظات بعد</h3>
            <p className="text-muted-foreground max-w-md">
              ابدأ بتدوين أفكارك السريعة وملاحظاتك الهامة.
            </p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إنشاء ملاحظة جديدة
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && notes && notes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {notes.map(note => (
            <Card key={note.id} className={cn("flex flex-col", note.pinned ? "border-primary shadow-lg" : "")}>
                <CardHeader className="flex-row items-start justify-between pb-2">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <div className='flex items-center'>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePinNote(note)}>
                            {note.pinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(note)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
