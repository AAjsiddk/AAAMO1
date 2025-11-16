'use client';
import { useState, useMemo, useRef } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  PlusCircle,
  Trash2,
  Loader2,
  Inbox,
  Calendar,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Annoyed,
  CalendarHeart,
  ImagePlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { JournalEntry } from '@/lib/types';
import { format, isSameDay } from 'date-fns';
import Image from 'next/image';

// Placeholder for a real storage upload function
async function uploadImage(file: File): Promise<string> {
  // In a real app, you would upload to Firebase Storage and get the URL
  // For this prototype, we'll use a placeholder and convert the image to a Data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

const journalSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب.' }),
  content: z.string().min(1, { message: 'المحتوى مطلوب.' }),
  imageFile: z.instanceof(FileList).optional(),
});


const moodIcons: { [key in NonNullable<JournalEntry['mood']>]: React.ReactElement } = {
    happy: <Smile className="h-5 w-5 text-green-500" />,
    sad: <Frown className="h-5 w-5 text-blue-500" />,
    neutral: <Meh className="h-5 w-5 text-gray-500" />,
    excited: <Sparkles className="h-5 w-5 text-yellow-500" />,
    anxious: <Annoyed className="h-5 w-5 text-purple-500" />,
};

const moodTranslations: { [key in NonNullable<JournalEntry['mood']>]: string } = {
    happy: 'سعيد',
    sad: 'حزين',
    neutral: 'محايد',
    excited: 'متحمس',
    anxious: 'قلق',
};

const analyzeMood = (text: string): JournalEntry['mood'] => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('سعيد') || lowerText.includes('متحمس') || lowerText.includes('رائع')) return 'happy';
    if (lowerText.includes('حزين') || lowerText.includes('محبط') || lowerText.includes('سيء')) return 'sad';
    if (lowerText.includes('قلق') || lowerText.includes('متوتر')) return 'anxious';
    if (lowerText.includes('مثير') || lowerText.includes('مدهش')) return 'excited';
    return 'neutral';
};

export default function JournalPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOnThisDay, setShowOnThisDay] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: { title: '', content: '' },
  });
  
  const imageFileRef = form.register('imageFile');

  const journalCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/journalEntries`);
  }, [firestore, user]);

  const entriesQuery = useMemoFirebase(() => {
    if (!journalCollectionRef) return null;
    return query(journalCollectionRef, orderBy('createdAt', 'desc'));
  }, [journalCollectionRef]);

  const { data: allEntries, isLoading: isLoadingEntries } = useCollection<JournalEntry>(entriesQuery);

  const today = new Date();
  const entries = useMemo(() => {
    if (!allEntries) return [];
    if (showOnThisDay) {
        return allEntries.filter(entry => {
            if (!entry.createdAt) return false;
            const entryDate = (entry.createdAt as Timestamp).toDate();
            return !isSameDay(entryDate, today) && 
                   entryDate.getDate() === today.getDate() && 
                   entryDate.getMonth() === today.getMonth();
        });
    }
    return allEntries;
  }, [allEntries, showOnThisDay, today]);

  const onSubmit = async (values: z.infer<typeof journalSchema>) => {
    if (!firestore || !user || !journalCollectionRef) return;
    setIsSubmitting(true);
    
    try {
        const mood = analyzeMood(values.content);
        let imageUrl: string | undefined = undefined;

        if (values.imageFile && values.imageFile.length > 0) {
            // In a real app, this would upload to Firebase Storage
            // For now, we convert to a Data URL for demonstration
            imageUrl = await uploadImage(values.imageFile[0]);
        }

        const newEntry: Omit<JournalEntry, 'id'> = {
          title: values.title,
          content: values.content,
          userId: user.uid,
          mood: mood,
          createdAt: serverTimestamp(),
          imageUrl,
        };
        
        await addDoc(journalCollectionRef, newEntry);
        
        toast({ title: 'نجاح', description: 'تمت إضافة تدوينتك بنجاح.' });
        form.reset();
        setPreviewImage(null);
        setIsDialogOpen(false);
    } catch (error) {
        console.error("Error creating journal entry: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إنشاء التدوينة.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!firestore || !user) return;
    const entryDocRef = doc(firestore, `users/${user.uid}/journalEntries`, entryId);
    try {
        await deleteDoc(entryDocRef);
        toast({ title: 'تم الحذف', description: 'تم حذف التدوينة بنجاح.' });
    } catch (error) {
        console.error("Error deleting journal entry: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف التدوينة.' });
    }
  };

  const formatDate = (timestamp: JournalEntry['createdAt']) => {
    if (!timestamp || !(timestamp instanceof Timestamp)) {
      return 'الآن...';
    }
    return format(timestamp.toDate(), 'PPP p');
  };


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">المذكرات</h2>
        <div className="flex items-center space-x-2">
           <Button variant={showOnThisDay ? "default" : "outline"} onClick={() => setShowOnThisDay(!showOnThisDay)}>
                <CalendarHeart className="ml-2 h-4 w-4" />
                في مثل هذا اليوم
            </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { form.reset(); setPreviewImage(null); } setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                تدوينة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>تدوينة جديدة</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField name="title" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="يوم مميز..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="content" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>المحتوى</FormLabel><FormControl><Textarea placeholder="ماذا يدور في خلدك؟" {...field} rows={6} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormItem>
                    <FormLabel>إضافة صورة (اختياري)</FormLabel>
                    <FormControl>
                        <div 
                            className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10"
                            onClick={() => fileInputRef.current?.click()}
                        >
                        <div className="text-center">
                            {previewImage ? (
                                <Image src={previewImage} alt="Preview" width={200} height={200} className="mx-auto h-24 w-auto rounded-md" />
                            ) : (
                                <>
                                    <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-4 text-sm leading-6 text-muted-foreground">اسحب وأفلت صورة أو انقر للاختيار</p>
                                </>
                            )}
                        </div>
                        <Input 
                            {...imageFileRef}
                            ref={fileInputRef}
                            id="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setPreviewImage(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                } else {
                                    setPreviewImage(null);
                                }
                            }}
                        />
                        </div>
                    </FormControl>
                  </FormItem>

                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      حفظ
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoadingEntries && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

      {!isLoadingEntries && (!entries || entries.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">{showOnThisDay ? "لا توجد ذكريات في مثل هذا اليوم" : "لا توجد تدوينات بعد"}</h3>
            <p className="text-muted-foreground">{showOnThisDay ? "ربما العام القادم؟" : "ابدأ بكتابة أول تدوينة لك."}</p>
             {!showOnThisDay && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="ml-2 h-4 w-4" />
                تدوينة جديدة
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoadingEntries && entries && entries.length > 0 && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{entry.title}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDelete(entry.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-xs pt-1">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(entry.createdAt)}</span>
                    {entry.mood && moodIcons[entry.mood] && (
                        <span className="flex items-center gap-1">
                            {moodIcons[entry.mood]}
                            <span>{moodTranslations[entry.mood]}</span>
                        </span>
                    )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {entry.imageUrl && (
                    <div className="mb-4 relative aspect-video max-w-lg overflow-hidden rounded-md">
                        <Image src={entry.imageUrl} alt={entry.title} fill={true} className="object-cover" />
                    </div>
                )}
                <p className="whitespace-pre-wrap">{entry.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
