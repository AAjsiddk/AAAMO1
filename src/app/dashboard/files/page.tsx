'use client';
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, serverTimestamp, doc, addDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { ImportantFile } from '@/lib/types';
import {
  PlusCircle,
  Loader2,
  File as FileIcon,
  Trash2,
  Edit,
  ExternalLink,
  Inbox,
  Pin,
  PinOff,
  GripVertical,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const importantFileSchema = z.object({
  name: z.string().min(1, { message: 'اسم الملف مطلوب.' }),
  location: z.string().min(1, { message: 'موقع الملف مطلوب.' }),
  importance: z.enum(['low', 'normal', 'high', 'urgent']),
});

const importanceMap: { [key in ImportantFile['importance']]: { text: string; className: string } } = {
  urgent: { text: 'عاجل', className: 'bg-red-500/20 text-red-500 border-red-500/30' },
  high: { text: 'مرتفع', className: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  normal: { text: 'متوسط', className: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  low: { text: 'منخفض', className: 'bg-gray-500/20 text-gray-500 border-gray-500/30' },
};


export default function ImportantFilesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFile, setEditingFile] = useState<ImportantFile | null>(null);

  const form = useForm<z.infer<typeof importantFileSchema>>({
    resolver: zodResolver(importantFileSchema),
    defaultValues: { name: '', location: '', importance: 'normal' },
  });

  const filesCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/importantFiles`);
  }, [user, firestore]);

  const filesQuery = useMemoFirebase(() => {
    if (!filesCollectionRef) return null;
    return query(filesCollectionRef);
  }, [filesCollectionRef]);

  const { data: files, isLoading } = useCollection<ImportantFile>(filesQuery);

  const sortedFiles = useMemo(() => {
    if (!files) return [];
    return [...files].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [files]);
  
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !sortedFiles || !firestore || !user) return;

    const items = Array.from(sortedFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const batch = writeBatch(firestore);
    items.forEach((item, index) => {
      const docRef = doc(firestore, `users/${user!.uid}/importantFiles`, item.id);
      batch.update(docRef, { order: index });
    });

    batch.commit().catch(err => {
      console.error("Failed to reorder files", err);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إعادة ترتيب الملفات.' });
    });
  };

  const handleOpenDialog = (file: ImportantFile | null) => {
    setEditingFile(file);
    if (file) {
      form.reset({ name: file.name, location: file.location, importance: file.importance });
    } else {
      form.reset({ name: '', location: '', importance: 'normal' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof importantFileSchema>) => {
    if (!user || !filesCollectionRef) return;
    setIsSubmitting(true);

    try {
      if (editingFile) {
        const fileDocRef = doc(firestore, `users/${user.uid}/importantFiles`, editingFile.id);
        await updateDoc(fileDocRef, values);
        toast({ title: 'نجاح', description: 'تم تحديث الملف.' });
      } else {
        await addDoc(filesCollectionRef, {
          ...values,
          userId: user.uid,
          pinned: false,
          order: files?.length || 0,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'نجاح', description: 'تمت إضافة الملف الهام.' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving file:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل ${editingFile ? 'تحديث' : 'حفظ'} الملف.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/importantFiles`, fileId));
      toast({ title: 'نجاح', description: 'تم حذف الملف.' });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الملف.' });
    }
  };
  
  const handleTogglePin = async (file: ImportantFile) => {
    if (!firestore || !user) return;
    const fileDocRef = doc(firestore, `users/${user.uid}/importantFiles`, file.id);
    try {
      await updateDoc(fileDocRef, { pinned: !file.pinned });
      toast({ title: 'نجاح', description: `تم ${file.pinned ? 'إلغاء تثبيت' : 'تثبيت'} الملف.` });
    } catch (error) {
      console.error("Error pinning file:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تغيير حالة التثبيت.' });
    }
  };
  
  const handleDownload = (file: ImportantFile) => {
    toast({
        title: 'قيد التطوير',
        description: `جاري محاكاة تنزيل ملف: ${file.name}`
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingFile ? 'تعديل الملف' : 'إضافة ملف هام'}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>اسم الملف</FormLabel><FormControl><Input placeholder="مثال: تقرير الأرباح" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>موقع الملف</FormLabel><FormControl><Input placeholder="مثال: مجلد المشاريع / Drive" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="importance" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأهمية</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger><SelectValue placeholder="اختر درجة الأهمية" /></SelectTrigger></FormControl>
                        <SelectContent>
                           {Object.entries(importanceMap).map(([key, {text}]) => (
                             <SelectItem key={key} value={key}>{text}</SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} {editingFile ? 'حفظ التعديلات' : 'إضافة'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
    
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ملفاتي الهامة</h2>
        <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="ml-2 h-4 w-4" /> إضافة ملف</Button>
      </div>

       <Card className="bg-card/70 border-primary/20">
          <CardHeader>
             <CardTitle>الوصول السريع لنظام الملفات</CardTitle>
             <CardDescription>انقر على الزر لفتح نظام إدارة الملفات والمجلدات الخارجي الخاص بك.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="https://main-folder-v22-live.yw.app/" target="_blank">
                    <ExternalLink className="ml-2 h-4 w-4"/>
                    فتح نظام الملفات
                </Link>
            </Button>
          </CardContent>
       </Card>

       <Card>
            <CardHeader>
                <CardTitle>قائمة الملفات الهامة</CardTitle>
                <CardDescription>قائمة مخصصة لتتبع ملفاتك الأكثر أهمية والوصول إليها بسرعة.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      
                  {!isLoading && (!sortedFiles || sortedFiles.length === 0) && (
                    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center border-2 border-dashed rounded-lg">
                        <Inbox className="h-16 w-16 text-muted-foreground" />
                        <h3 className="text-xl font-semibold">لا توجد ملفات هامة بعد</h3>
                        <p className="text-muted-foreground max-w-md">ابدأ بإضافة الملفات التي تحتاج للوصول إليها باستمرار.</p>
                    </div>
                  )}

                {!isLoading && sortedFiles && sortedFiles.length > 0 && (
                    <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="importantFiles">
                        {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {sortedFiles.map((file, index) => {
                                const importanceData = importanceMap[file.importance] || importanceMap['normal'];
                                return (
                                <Draggable key={file.id} draggableId={file.id} index={index}>
                                    {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} className={cn("rounded-lg border p-4 bg-background flex flex-col sm:flex-row items-start sm:items-center gap-4", file.pinned && "border-primary/50 bg-primary/5")}>
                                        <div className="flex items-center gap-4 flex-grow">
                                            <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground"><GripVertical /></div>
                                            <FileIcon className="h-6 w-6 text-primary flex-shrink-0" />
                                            <div className="flex-grow">
                                                <h4 className="font-semibold">{file.name}</h4>
                                                <p className="text-sm text-muted-foreground">{file.location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto">
                                            <Badge variant="outline" className={cn("flex-shrink-0", importanceData?.className)}>{importanceData?.text}</Badge>
                                            <div className="flex items-center sm:ml-auto">
                                                <Button variant="ghost" size="icon" onClick={() => handleDownload(file)} title='تنزيل'>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleTogglePin(file)} title={file.pinned ? 'إلغاء التثبيت' : 'تثبيت'}>
                                                    {file.pinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(file)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteFile(file.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                </Draggable>
                                )
                            })}
                            {provided.placeholder}
                        </div>
                        )}
                    </Droppable>
                    </DragDropContext>
                )}
            </CardContent>
       </Card>
    </div>
   );
}
