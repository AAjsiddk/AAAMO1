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
import { collection, doc, serverTimestamp, query, where, addDoc, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Plus, Trash2, Loader2, BookOpen, Link as LinkIcon, HandHeart, Minus, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WorshipAct } from '@/lib/types';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/style.css';
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { subYears, format } from 'date-fns';
import Link from 'next/link';

const actSchema = z.object({
  name: z.string().min(1, { message: 'اسم العمل مطلوب.' }),
  notes: z.string().optional(),
});


export default function FaithPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof actSchema>>({
    resolver: zodResolver(actSchema),
    defaultValues: { name: '', notes: '' },
  });
  
  const todayString = format(new Date(), 'yyyy-MM-dd');
  
  const actsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/worshipActs`);
  }, [firestore, user]);

  // Query for today's acts
  const todayActsQuery = useMemoFirebase(() => {
    if (!actsCollectionRef) return null;
    return query(actsCollectionRef, where('date', '==', todayString));
  }, [actsCollectionRef, todayString]);
  
  // Query for all acts for the heatmap
  const allActsQuery = useMemoFirebase(() => actsCollectionRef, [actsCollectionRef]);

  const { data: todayActs, isLoading: isLoadingToday } = useCollection<WorshipAct>(todayActsQuery);
  const { data: allActs, isLoading: isLoadingAll } = useCollection<WorshipAct>(allActsQuery);
  
  const heatmapData = useMemo(() => {
    if (!allActs) return [];
    return allActs.reduce((acc, act) => {
        const existing = acc.find(d => d.date === act.date);
        if (existing) {
            existing.count += (act.count || 1);
        } else {
            acc.push({ date: act.date, count: act.count || 1 });
        }
        return acc;
    }, [] as {date: string, count: number}[]);
  }, [allActs]);


  const onSubmit = async (values: z.infer<typeof actSchema>) => {
    if (!actsCollectionRef || !user) return;
    setIsSubmitting(true);

    try {
        await addDoc(actsCollectionRef, {
            ...values,
            userId: user.uid,
            date: todayString,
            count: 1,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'نجاح', description: 'تقبل الله. تم تسجيل العمل.' });
        form.reset();
    } catch (error) {
        console.error("Error saving act: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: `فشل تسجيل العمل.` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleActUpdate = async(act: WorshipAct, change: 1 | -1) => {
     if (!firestore || !user) return;
     const actDocRef = doc(firestore, `users/${user.uid}/worshipActs`, act.id);
     const newCount = (act.count || 0) + change;
     if (newCount <= 0) {
         await deleteDoc(actDocRef);
         toast({title: "تم الحذف", description: "تم حذف العمل من قائمة اليوم."});
     } else {
         await updateDoc(actDocRef, { count: newCount });
     }
  }

  const handleDeleteAct = async (actId: string) => {
    if (!firestore || !user) return;
    const actDocRef = doc(firestore, `users/${user.uid}/worshipActs`, actId);
    try {
        await deleteDoc(actDocRef);
    } catch (error) {
        console.error("Error deleting act: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف العمل.' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ركن العبادات</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
                <CardTitle>أعمال اليوم</CardTitle>
                <CardDescription>سجل العبادات التي قمت بها اليوم.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex gap-2">
                      <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem className="flex-grow">
                              <FormLabel className="sr-only">اسم العمل</FormLabel>
                              <FormControl>
                                  <Input placeholder="مثال: قراءة سورة الكهف، صدقة..." {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                </Form>
                <div className="mt-6 space-y-2">
                    {isLoadingToday ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : 
                     (todayActs && todayActs.length > 0) ? todayActs.map(act => (
                        <div key={act.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <span className="font-medium">{act.name}</span>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleActUpdate(act, 1)}><Plus className="h-4 w-4"/></Button>
                                <span className="font-bold text-primary">{act.count || 1}</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleActUpdate(act, -1)}><Minus className="h-4 w-4"/></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteAct(act.id)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                     )) : <p className="text-center text-sm text-muted-foreground pt-4">لم تسجل أي أعمال اليوم.</p>
                    }
                </div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle>خريطة العبادات</CardTitle>
                <CardDescription>نظرة على التزامك خلال العام الماضي.</CardDescription>
            </CardHeader>
             <CardContent>
                {isLoadingAll ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : 
                    <>
                        <CalendarHeatmap
                            startDate={subYears(new Date(), 1)}
                            endDate={new Date()}
                            values={heatmapData}
                            classForValue={(value) => {
                                if (!value) { return 'color-empty'; }
                                return `color-scale-1`;
                            }}
                            tooltipDataAttrs={(value: {date: string, count: number}) => {
                                return {
                                'data-tooltip-id': 'heatmap-tooltip',
                                'data-tooltip-content': `${value.date}: ${value.count} عمل`,
                                };
                            }}
                        />
                        <ReactTooltip id="heatmap-tooltip" />
                    </>
                }
                 <Button asChild className="w-full mt-4" variant="outline">
                    <Link href="https://remembrances-1.vercel.app/" target="_blank">
                        <BookOpen className="ml-2 h-4 w-4" />
                        موقع أذكار وأدعية (نجاتك بيدك)
                    </Link>
                </Button>
            </CardContent>
          </Card>
      </div>

    </div>
  );
}
