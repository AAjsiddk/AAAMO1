'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smile, Loader2, Edit, Trash2 } from 'lucide-react';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/lib/types';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { subYears, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const moodTranslations: { [key in NonNullable<JournalEntry['mood']>]: string } = {
    happy: 'سعيد',
    sad: 'حزين',
    neutral: 'محايد',
    excited: 'متحمس',
    anxious: 'قلق',
};

const COLORS = {
    happy: '#22c55e',
    excited: '#f59e0b',
    neutral: '#6b7280',
    anxious: '#8b5cf6',
    sad: '#3b82f6',
};

const heatmapColors = {
  happy: 'rgba(34, 197, 94, 1)',
  excited: 'rgba(245, 158, 11, 1)',
  neutral: 'rgba(107, 114, 128, 0.7)',
  anxious: 'rgba(139, 92, 246, 1)',
  sad: 'rgba(59, 130, 246, 1)',
};

const moodEntrySchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب.'),
  content: z.string().min(1, 'المحتوى مطلوب.'),
});


export default function MoodPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const form = useForm<z.infer<typeof moodEntrySchema>>({
    resolver: zodResolver(moodEntrySchema),
    defaultValues: { title: '', content: '' },
  });

  const journalQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/journalEntries`), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: entries, isLoading } = useCollection<JournalEntry>(journalQuery);

  const moodData = useMemo(() => {
    if (!entries) return [];
    const counts = entries.reduce((acc, entry) => {
        if (entry.mood) {
            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        }
        return acc;
    }, {} as {[key in NonNullable<JournalEntry['mood']>]: number});

    return Object.entries(counts).map(([mood, count]) => ({
        name: moodTranslations[mood as keyof typeof moodTranslations],
        value: count,
        fill: COLORS[mood as keyof typeof COLORS],
    }));
  }, [entries]);
  
  const heatmapData = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => e.mood && e.createdAt).map(entry => ({
        date: format((entry.createdAt as Timestamp).toDate(), 'yyyy-MM-dd'),
        mood: entry.mood,
        entry: entry, // Keep the full entry for tooltip/actions
    }));
  }, [entries]);

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    const docRef = doc(firestore, `users/${user.uid}/journalEntries`, entryId);
    try {
      await deleteDoc(docRef);
      toast({ title: 'نجاح', description: 'تم حذف السجل.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف السجل.' });
    }
  };

  const handleOpenEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    form.reset({ title: entry.title, content: entry.content });
  };

  const handleEditSubmit = async (values: z.infer<typeof moodEntrySchema>) => {
    if (!user || !editingEntry) return;
    const docRef = doc(firestore, `users/${user.uid}/journalEntries`, editingEntry.id);
    try {
      await updateDoc(docRef, { ...values, updatedAt: serverTimestamp() });
      toast({ title: 'نجاح', description: 'تم تحديث السجل.' });
      setEditingEntry(null);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث السجل.' });
    }
  };


  return (
    <>
      <Dialog open={!!editingEntry} onOpenChange={(isOpen) => !isOpen && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل سجل المزاج</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
               <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>المحتوى</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
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
        <h2 className="text-3xl font-bold tracking-tight">مرآة الذات اليومية</h2>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : !entries || entries.length === 0 ? (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
                <Smile className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">لا توجد بيانات لعرضها</h3>
                <p className="text-muted-foreground max-w-md">
                    ابدأ بتسجيل حالتك المزاجية من خلال كتابة المذكرات أو استخدام زر الحالة المزاجية في الشريط العلوي.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>توزيع الحالات المزاجية</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {moodData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>خريطة الحالة المزاجية</CardTitle>
                    <CardDescription>نظرة على حالتك المزاجية خلال العام الماضي.</CardDescription>
                </CardHeader>
                <CardContent>
                     <CalendarHeatmap
                        startDate={subYears(new Date(), 1)}
                        endDate={new Date()}
                        values={heatmapData}
                        classForValue={(value) => {
                            if (!value || !value.mood) { return 'color-empty'; }
                            return `color-mood-${value.mood}`;
                        }}
                        tooltipDataAttrs={(value: any) => {
                             if (!value || !value.date) return {};
                             return {
                                'data-tooltip-id': 'heatmap-tooltip',
                                'data-tooltip-html': `
                                  <div class="flex flex-col gap-1">
                                    <span class="font-bold">${value.date}: ${moodTranslations[value.mood as keyof typeof moodTranslations] || 'غير معروف'}</span>
                                    <span class="text-xs">${value.entry?.title || ''}</span>
                                  </div>
                                `,
                             };
                        }}
                        onClick={(value) => value && value.entry && handleOpenEditDialog(value.entry)}
                    />
                    <ReactTooltip id="heatmap-tooltip" html />
                    <style>{`
                        .react-calendar-heatmap .color-mood-happy { fill: ${heatmapColors.happy}; }
                        .react-calendar-heatmap .color-mood-excited { fill: ${heatmapColors.excited}; }
                        .react-calendar-heatmap .color-mood-neutral { fill: ${heatmapColors.neutral}; }
                        .react-calendar-heatmap .color-mood-anxious { fill: ${heatmapColors.anxious}; }
                        .react-calendar-heatmap .color-mood-sad { fill: ${heatmapColors.sad}; }
                    `}</style>
                </CardContent>
            </Card>
        </div>
      )}

    </div>
    </>
  );
}
