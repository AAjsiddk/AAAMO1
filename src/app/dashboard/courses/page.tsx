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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Link as LinkIcon, Loader2, PlusCircle, Trash2, Pin, PinOff, Inbox, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

const courseSchema = z.object({
  title: z.string().min(1, { message: 'عنوان الدورة مطلوب.' }),
  url: z.string().url({ message: 'الرجاء إدخال رابط صحيح.' }),
  notes: z.string().optional(),
});

export default function CoursesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', url: '', notes: '' },
  });

  const coursesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/courses`);
  }, [firestore, user]);

  const coursesQuery = useMemoFirebase(() => {
    if (!coursesCollectionRef) return null;
    return query(coursesCollectionRef);
  }, [coursesCollectionRef]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  const sortedCourses = useMemo(() => {
    if (!courses) return [];
    return [...courses].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.order || 0) - (b.order || 0);
    });
  }, [courses]);

  const openDialog = (course: Course | null) => {
    if (course) {
      setEditingCourse(course);
      form.reset({ title: course.title, url: course.url, notes: course.notes });
    } else {
      setEditingCourse(null);
      form.reset({ title: '', url: '', notes: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSaveCourse = async (values: z.infer<typeof courseSchema>) => {
    if (!coursesCollectionRef || !user) return;
    setIsSubmitting(true);
    try {
      if (editingCourse) {
        const courseDocRef = doc(firestore, `users/${user.uid}/courses`, editingCourse.id);
        await updateDoc(courseDocRef, values);
        toast({ title: 'نجاح', description: 'تم تحديث الدورة بنجاح.' });
      } else {
        await addDoc(coursesCollectionRef, {
          ...values,
          userId: user.uid,
          pinned: false,
          order: sortedCourses.length,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'نجاح', description: 'تمت إضافة الدورة بنجاح.' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving course:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل حفظ الدورة.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!firestore || !user) return;
    const courseDocRef = doc(firestore, `users/${user.uid}/courses`, courseId);
    try {
      await deleteDoc(courseDocRef);
      toast({ title: 'تم الحذف', description: 'تم حذف الدورة بنجاح.' });
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الدورة.' });
    }
  };

  const handleTogglePin = async (course: Course) => {
    if (!firestore || !user) return;
    const courseDocRef = doc(firestore, `users/${user.uid}/courses`, course.id);
    try {
      await updateDoc(courseDocRef, { pinned: !course.pinned });
      toast({ title: 'نجاح', description: `تم ${course.pinned ? 'إلغاء تثبيت' : 'تثبيت'} الدورة.` });
    } catch (error) {
      console.error("Error pinning course:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تغيير حالة التثبيت.' });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !sortedCourses || !firestore) return;

    const items = Array.from(sortedCourses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const batch = writeBatch(firestore);
    items.forEach((item, index) => {
      const docRef = doc(firestore, `users/${user!.uid}/courses`, item.id);
      batch.update(docRef, { order: index });
    });

    batch.commit().catch(err => {
      console.error("Failed to reorder courses", err);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إعادة ترتيب الدورات.' });
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الدورات التعليمية</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button onClick={() => openDialog(null)}><PlusCircle className="ml-2 h-4 w-4" /> إضافة دورة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCourse ? 'تعديل الدورة' : 'إضافة دورة جديدة'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveCourse)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>عنوان الدورة</FormLabel><FormControl><Input placeholder="مثال: مقدمة في علوم البيانات" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="url" render={({ field }) => (
                  <FormItem><FormLabel>رابط الدورة</FormLabel><FormControl><Input type="url" placeholder="https://www.coursera.org/..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Textarea placeholder="أي ملاحظات حول الدورة، مثل المتطلبات أو سبب الاهتمام." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} {editingCourse ? 'حفظ التعديلات' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      
      {!isLoading && (!sortedCourses || sortedCourses.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">لم تقم بإضافة أي دورات بعد</h3>
            <p className="text-muted-foreground max-w-md">ابدأ بإضافة الدورات التي تود دراستها لتنظيم مسارك التعليمي.</p>
            <Button onClick={() => openDialog(null)}><PlusCircle className="ml-2 h-4 w-4" /> إضافة دورة جديدة</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && sortedCourses && sortedCourses.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="courses">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {sortedCourses.map((course, index) => (
                  <Draggable key={course.id} draggableId={course.id} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <Card className={cn("relative group", course.pinned && "border-primary")}>
                          {course.pinned && <div className="absolute top-3 right-3 text-primary"><Pin className="h-5 w-5" /></div>}
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                              <BookOpen className="h-6 w-6 text-primary" />
                              <span>{course.title}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">{course.notes || 'لا توجد ملاحظات.'}</p>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center">
                             <Button asChild variant="secondary"><Link href={course.url} target="_blank">الانتقال إلى الدورة <LinkIcon className="mr-2 h-4 w-4"/></Link></Button>
                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" onClick={() => handleTogglePin(course)}>{course.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}</Button>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDialog(course); }}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => {e.stopPropagation(); handleDeleteCourse(course.id)}} ><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </CardFooter>
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
  );
}
