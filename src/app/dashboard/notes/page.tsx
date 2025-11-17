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
import { collection, doc, serverTimestamp, query, addDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StickyNote, Send, Loader2, Trash2, Inbox, Palette, Pin, PinOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import type { Note } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const noteSchema = z.object({
  content: z.string().min(1, { message: 'لا يمكن حفظ ملاحظة فارغة.' }),
});

const noteColors = {
    default: 'bg-muted/50',
    yellow: 'bg-yellow-500/20',
    green: 'bg-green-500/20',
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20',
    pink: 'bg-pink-500/20',
};

type NoteColor = keyof typeof noteColors;


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
    return query(notesCollectionRef);
  }, [notesCollectionRef]);

  const { data: notes, isLoading } = useCollection<Note>(notesQuery);

  const sortedNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.order || 0) - (b.order || 0);
    });
  }, [notes]);
  

  const handleSaveNote = async (values: z.infer<typeof noteSchema>) => {
    if (!notesCollectionRef || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(notesCollectionRef, {
        userId: user.uid,
        content: values.content,
        color: 'default',
        pinned: false,
        order: sortedNotes.length,
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

  const handleTogglePin = async (note: Note) => {
    if (!firestore || !user) return;
    const noteDocRef = doc(firestore, `users/${user.uid}/notes`, note.id);
    try {
      await updateDoc(noteDocRef, { pinned: !note.pinned });
      toast({ title: 'نجاح', description: `تم ${note.pinned ? 'إلغاء تثبيت' : 'تثبيت'} الملاحظة.` });
    } catch (error) {
      console.error("Error pinning note:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تغيير حالة التثبيت.' });
    }
  };

  const handleChangeColor = async (noteId: string, color: NoteColor) => {
    if (!firestore || !user) return;
    const noteDocRef = doc(firestore, `users/${user.uid}/notes`, noteId);
    try {
      await updateDoc(noteDocRef, { color });
    } catch (error) {
      console.error("Error changing color:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تغيير اللون.' });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !sortedNotes || !firestore) {
      return;
    }

    const items = Array.from(sortedNotes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const batch = writeBatch(firestore);
    items.forEach((item, index) => {
      const docRef = doc(firestore, `users/${user.uid}/notes`, item.id);
      batch.update(docRef, { order: index });
    });

    batch.commit().catch(err => {
      console.error("Failed to reorder notes", err);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إعادة ترتيب الملاحظات.' });
    });
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

      <div className="mt-8">
        <CardHeader>
          <CardTitle>أرشيف الملاحظات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {!isLoading && (!sortedNotes || sortedNotes.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center border-2 border-dashed rounded-lg">
              <Inbox className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">لا توجد ملاحظات بعد</h3>
              <p className="text-muted-foreground">
                ملاحظاتك ستظهر هنا.
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="notes">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {sortedNotes?.map((note, index) => (
                                <Draggable key={note.id} draggableId={note.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{...provided.draggableProps.style}}
                                        >
                                          <Card className={cn("relative group", noteColors[note.color as NoteColor] || 'bg-muted/50', snapshot.isDragging && 'shadow-lg')}>
                                            {note.pinned && <div className="absolute top-2 right-2 text-primary"><Pin className="h-5 w-5" /></div>}
                                            <CardContent className="p-4">
                                              <div className="flex justify-between items-start">
                                                <p className="text-foreground whitespace-pre-wrap flex-1 mr-10">{note.content}</p>
                                                <div className="absolute top-2 left-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="h-8 w-8"><Palette className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                      {Object.entries(noteColors).map(([colorKey, colorClass]) => (
                                                        <DropdownMenuItem key={colorKey} onSelect={() => handleChangeColor(note.id, colorKey as NoteColor)}>
                                                          <div className={cn("w-4 h-4 rounded-full mr-2", colorClass)} />
                                                          <span>{colorKey}</span>
                                                        </DropdownMenuItem>
                                                      ))}
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePin(note)}>
                                                    {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                                                  </Button>
                                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteNote(note.id)}>
                                                      <Trash2 className="h-4 w-4 text-destructive"/>
                                                  </Button>
                                                </div>
                                              </div>
                                              <p className="text-xs text-muted-foreground mt-2">
                                                {note.createdAt ? `${formatDistanceToNow( (note.createdAt as any).toDate(), { addSuffix: true, locale: ar })}` : 'الآن'}
                                              </p>
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
        </CardContent>
      </div>
    </div>
  );
}
