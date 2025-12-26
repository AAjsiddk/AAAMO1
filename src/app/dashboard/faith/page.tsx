'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, writeBatch, Timestamp, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, Edit2, Save, Landmark, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Prayer, WorshipAct } from '@/lib/types';
import { format, startOfDay } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';

const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type PrayerName = typeof prayerNames[number];
const prayerTranslations: Record<PrayerName, string> = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };

const prayerSchema = z.object({
    times: z.object({ Fajr: z.string(), Dhuhr: z.string(), Asr: z.string(), Maghrib: z.string(), Isha: z.string() })
});
type PrayerFormData = z.infer<typeof prayerSchema>;

const worshipActSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "الاسم مطلوب"),
    notes: z.string().optional()
});
type WorshipFormData = z.infer<typeof worshipActSchema>;

async function getPrayerTimes() {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Dubai&country=AE&method=8`);
        if (!response.ok) throw new Error('Failed to fetch prayer times');
        const data = await response.json();
        return data.data.timings;
    } catch (error) {
        console.error("Could not fetch prayer times, using defaults.", error);
        return { Fajr: '04:30', Dhuhr: '12:30', Asr: '16:00', Maghrib: '19:00', Isha: '20:30' };
    }
}

export default function FaithPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditingTimes, setIsEditingTimes] = useState(false);
    const [isLoadingTimes, setIsLoadingTimes] = useState(true);
    const [editingWorshipId, setEditingWorshipId] = useState<string | null>(null);

    const prayerForm = useForm<PrayerFormData>({ resolver: zodResolver(prayerSchema), defaultValues: { times: { Fajr: '00:00', Dhuhr: '00:00', Asr: '00:00', Maghrib: '00:00', Isha: '00:00' } } });
    const worshipForm = useForm<WorshipFormData>({ resolver: zodResolver(worshipActSchema) });

    const todayString = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const prayersQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/prayers`), where('date', '==', todayString)) : null, [user, firestore, todayString]);
    const worshipActsQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/worshipActs`)) : null, [user, firestore]);

    const { data: prayers, isLoading: isLoadingPrayers } = useCollection<Prayer>(prayersQuery);
    const { data: worshipActs, isLoading: isLoadingWorshipActs } = useCollection<WorshipAct>(worshipActsQuery);

    const prayerData = useMemo(() => new Map(prayers?.map(p => [p.prayerName, p])), [prayers]);

    const fetchAndSetPrayerTimes = useCallback(() => {
        setIsLoadingTimes(true);
        getPrayerTimes().then(times => {
            prayerForm.reset({ times: { Fajr: times.Fajr, Dhuhr: times.Dhuhr, Asr: times.Asr, Maghrib: times.Magrib || times.Maghrib, Isha: times.Isha } });
        }).catch(error => {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب أوقات الصلاة تلقائيًا.' });
            console.error(error);
        }).finally(() => setIsLoadingTimes(false));
    }, [prayerForm, toast]);

    useEffect(() => { fetchAndSetPrayerTimes(); }, [fetchAndSetPrayerTimes]);

    const handleUpdatePrayer = async (prayerName: PrayerName, field: 'isDoneInMosque' | 'notes', value: boolean | string) => {
        if (!user || !firestore) return;
        const id = `${todayString}_${prayerName}`;
        const docRef = doc(firestore, `users/${user.uid}/prayers`, id);
        try {
            await setDoc(docRef, { [field]: value, userId: user.uid, date: todayString, prayerName, updatedAt: serverTimestamp() }, { merge: true });
        } catch (error) {
            console.error('Error updating prayer:', error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث بيانات الصلاة.' });
        }
    };

    const handleWorshipSubmit = async (data: WorshipFormData) => {
        if (!user || !firestore) return;
        const id = editingWorshipId || doc(collection(firestore, 'tmp')).id;
        const docRef = doc(firestore, `users/${user.uid}/worshipActs`, id);
        try {
            await setDoc(docRef, { ...data, id, userId: user.uid, date: todayString, createdAt: serverTimestamp() }, { merge: true });
            toast({ title: 'نجاح', description: 'تم حفظ العبادة بنجاح.' });
            setEditingWorshipId(null);
            worshipForm.reset({ name: '', notes: '' });
        } catch (error) {
            console.error('Error saving worship act:', error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ العبادة.' });
        }
    };

    const startEditWorship = (act: WorshipAct) => {
        setEditingWorshipId(act.id);
        worshipForm.reset({ name: act.name, notes: act.notes || '' });
    };

    const cancelEditWorship = () => {
        setEditingWorshipId(null);
        worshipForm.reset({ name: '', notes: '' });
    };

    const handleDeleteWorship = async (actId: string) => {
        if (!user) return;
        const docRef = doc(firestore, `users/${user.uid}/worshipActs`, actId);
        try {
            await deleteDoc(docRef);
            toast({title: 'تم الحذف'});
        } catch(e) {
            toast({variant: 'destructive', title: 'خطأ', description: 'فشل حذف العبادة'});
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2"><h2 className="text-3xl font-bold tracking-tight">العبادات</h2></div>
            <Card className="bg-card/70 border-primary/20">
                <CardHeader><CardTitle>حصن المسلم</CardTitle><CardDescription>بوابتك اليومية للأذكار والأدعية.</CardDescription></CardHeader>
                <CardContent><Button asChild><Link href="https://remembrances-1.vercel.app/" target="_blank"><ExternalLink className="ml-2 h-4 w-4"/>افتح الأذكار</Link></Button></CardContent>
            </Card>
            <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
                <AccordionItem value="item-1"><AccordionTrigger><CardTitle className="text-lg">متابعة الصلوات</CardTitle></AccordionTrigger>
                    <AccordionContent>
                        <Card className="border-0 shadow-none">
                            <CardHeader><div className="flex items-center justify-between"><div><CardTitle>أوقات صلاة اليوم</CardTitle><CardDescription>{isEditingTimes ? 'عدّل أوقات الصلاة حسب مدينتك' : 'الأوقات تضبط تلقائيًا حسب موقعك'}</CardDescription></div><Button variant="ghost" size="icon" onClick={() => setIsEditingTimes(!isEditingTimes)}>{isEditingTimes ? <Save className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}</Button></div></CardHeader>
                            <CardContent>{isLoadingTimes ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{prayerNames.map((name) => (<div key={name} className="space-y-2"><label className="font-semibold text-lg">{prayerTranslations[name]}</label><Input type="time" disabled={!isEditingTimes} {...prayerForm.register(`times.${name}`)} className="text-center text-lg"/></div>))}</div>}</CardContent>
                        </Card>
                        <Card className="mt-4 border-0 shadow-none">
                            <CardHeader><CardTitle>سجل صلوات اليوم</CardTitle><CardDescription>سجل أداءك لصلوات اليوم وأضف ملاحظاتك.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">{isLoadingPrayers ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : prayerNames.map(name => { const currentPrayer = prayerData.get(name); return (<div key={name} className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-card border"><div className="flex items-center gap-4"><Landmark className="h-8 w-8 text-primary"/><div><h3 className="text-xl font-bold">{prayerTranslations[name]}</h3><p className="text-muted-foreground text-sm">{prayerForm.getValues(`times.${name}`)}</p></div></div><div className="flex-grow w-full md:w-auto"><Input placeholder="أضف ملاحظة (مثال: خشوع، دعاء...)" defaultValue={currentPrayer?.notes || ''} onBlur={(e) => handleUpdatePrayer(name, 'notes', e.target.value)} className="w-full"/></div><div className="flex items-center gap-2 flex-shrink-0"><span className="text-sm font-medium">صليتها في المسجد؟</span><Button variant={currentPrayer?.isDoneInMosque ? 'default' : 'outline'} size="icon" onClick={() => handleUpdatePrayer(name, 'isDoneInMosque', !currentPrayer?.isDoneInMosque)}><Check /></Button></div></div>);})}</CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2"><AccordionTrigger><CardTitle className="text-lg">عبادات أخرى</CardTitle></AccordionTrigger>
                    <AccordionContent>
                        <Card className="border-0 shadow-none">
                            <CardHeader><CardDescription>سجل عباداتك الأخرى مثل قراءة القرآن، الأذكار، الصدقة وغيرها.</CardDescription></CardHeader>
                            <CardContent>
                                <Form {...worshipForm}>
                                    <form onSubmit={worshipForm.handleSubmit(handleWorshipSubmit)} className="p-4 border rounded-lg space-y-4">
                                        <h4 className="font-semibold">{editingWorshipId ? 'تعديل عبادة' : 'إضافة عبادة جديدة'}</h4>
                                        <FormField control={worshipForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>العبادة</FormLabel><FormControl><Input placeholder="قراءة قرآن" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={worshipForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات وتفاصيل</FormLabel><FormControl><Textarea placeholder="سورة البقرة، دعاء الاستفتاح..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <div className="flex gap-2">
                                            <Button type="submit">{editingWorshipId ? 'حفظ التعديلات' : 'إضافة عبادة'}</Button>
                                            {editingWorshipId && <Button type="button" variant="ghost" onClick={cancelEditWorship}>إلغاء</Button>}
                                        </div>
                                    </form>
                                </Form>
                                <div className="mt-6 space-y-3">
                                    <h4 className="font-semibold">قائمة العبادات</h4>
                                    {isLoadingWorshipActs ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : worshipActs && worshipActs.length > 0 ? worshipActs.map(act => (
                                        <Card key={act.id} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold">{act.name}</p>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{act.notes}</p>
                                                </div>
                                                <div className='flex items-center'>
                                                    <Button variant="ghost" size="icon" onClick={() => startEditWorship(act)}><Edit2 className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteWorship(act.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </Card>
                                    )) : <p className="text-sm text-muted-foreground text-center">لم تقم بإضافة عبادات أخرى بعد.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
