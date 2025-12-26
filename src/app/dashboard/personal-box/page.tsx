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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Archive,
  Calendar,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Annoyed,
  CalendarHeart,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { JournalEntry } from '@/lib/types';
import { format, isSameDay } from 'date-fns';
import Image from 'next/image';

const journalSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب.' }),
  content: z.string().min(1, { message: 'المحتوى مطلوب.' }),
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

export default function PersonalBoxPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOnThisDay, setShowOnThisDay] = useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: { title: '', content: '' },
  });
  

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
    // Filter out special entries from other sections
    return allEntries.filter(entry => entry.title !== 'Gratitude Entry' && entry.title !== 'My Beautiful Moment' && entry.title !== 'لحظة سعيدة');
  }, [allEntries, showOnThisDay, today]);

  const onSubmit = async (values: z.infer<typeof journalSchema>) => {
    if (!firestore || !user || !journalCollectionRef) return;
    setIsSubmitting(true);
    
    try {
        const mood = analyzeMood(values.content);
        
        const newEntry: Omit<JournalEntry, 'id'> = {
          title: values.title,
          content: values.content,
          userId: user.uid,
          mood: mood,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await addDoc(journalCollectionRef, newEntry);
        
        toast({ title: 'نجاح', description: 'تمت إضافة تدوينتك بنجاح.' });
        form.reset();
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
        <h2 className="text-3xl font-bold tracking-tight">الصندوق الشخصي</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
           <Button variant={showOnThisDay ? "default" : "outline"} onClick={() => setShowOnThisDay(!showOnThisDay)}>
                <CalendarHeart className="ml-2 h-4 w-4" />
                في مثل هذا اليوم
            </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { form.reset(); } setIsDialogOpen(open); }}>
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
        <Card className="bg-card/70 border-border/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Archive className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">{showOnThisDay ? "لا توجد ذكريات في مثل هذا اليوم" : "صندوقك الشخصي فارغ"}</h3>
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
            <Card key={entry.id} className="bg-card/70 border-border/50 backdrop-blur-sm overflow-hidden">
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
                <p className="whitespace-pre-wrap">{entry.content}</p>
              </CardContent>
              {entry.updatedAt && entry.createdAt && !(entry.createdAt as Timestamp).isEqual((entry.updatedAt as Timestamp)) && (
                <CardFooter>
                    <p className="text-xs text-muted-foreground">آخر تعديل: {formatDate(entry.updatedAt)}</p>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
