'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, writeBatch, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X, Edit2, Save, Landmark, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Prayer, WorshipAct } from '@/lib/types';
import { format, startOfDay } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';


const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type PrayerName = typeof prayerNames[number];
const prayerTranslations: Record<PrayerName, string> = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
};

const prayerSchema = z.object({
    times: z.object({
        Fajr: z.string(),
        Dhuhr: z.string(),
        Asr: z.string(),
        Maghrib: z.string(),
        Isha: z.string(),
    })
});

type PrayerFormData = z.infer<typeof prayerSchema>;

const worshipActSchema = z.object({
    acts: z.array(z.object({
        id: z.string().optional(),
        name: z.string().min(1, "الاسم مطلوب"),
        count: z.coerce.number().optional(),
        notes: z.string().optional()
    }))
});

type WorshipFormData = z.infer<typeof worshipActSchema>;

async function getPrayerTimes() {
    const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Dubai&country=AE&method=8`);
    if (!response.ok) {
        throw new Error('Failed to fetch prayer times');
    }
    const data = await response.json();
    return data.data.timings;
}

export default function FaithPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditingTimes, setIsEditingTimes] = useState(false);
    const [isLoadingTimes, setIsLoadingTimes] = useState(true);

    const prayerForm = useForm<PrayerFormData>({
        resolver: zodResolver(prayerSchema),
        defaultValues: {
            times: { Fajr: '00:00', Dhuhr: '00:00', Asr: '00:00', Maghrib: '00:00', Isha: '00:00' },
        },
    });

    const worshipForm = useForm<WorshipFormData>({
        resolver: zodResolver(worshipActSchema),
        defaultValues: { acts: [] }
    });

    const { fields, append, remove } = useFieldArray({
        control: worshipForm.control,
        name: "acts"
    });

    const todayString = format(startOfDay(new Date()), 'yyyy-MM-dd');

    const prayersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/prayers`), where('date', '==', todayString));
    }, [user, firestore, todayString]);
    
    const worshipActsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/worshipActs`), where('date', '==', todayString));
    }, [user, firestore, todayString]);

    const { data: prayers, isLoading: isLoadingPrayers } = useCollection<Prayer>(prayersQuery);
    const { data: worshipActs, isLoading: isLoadingWorshipActs } = useCollection<WorshipAct>(worshipActsQuery);

    const prayerData = useMemo(() => {
        const map = new Map<PrayerName, Prayer>();
        prayers?.forEach(p => map.set(p.prayerName, p));
        return map;
    }, [prayers]);

     useEffect(() => {
        if (worshipActs) {
            worshipForm.setValue('acts', worshipActs);
        }
    }, [worshipActs, worshipForm]);

    const fetchAndSetPrayerTimes = useCallback(() => {
        setIsLoadingTimes(true);
        getPrayerTimes().then(times => {
            prayerForm.reset({
                times: {
                    Fajr: times.Fajr,
                    Dhuhr: times.Dhuhr,
                    Asr: times.Asr,
                    Maghrib: times.Magrib,
                    Isha: times.Isha,
                },
            });
        }).catch(error => {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب أوقات الصلاة تلقائيًا.' });
            console.error(error);
        }).finally(() => {
            setIsLoadingTimes(false);
        });
    }, [prayerForm, toast]);

    useEffect(() => {
        fetchAndSetPrayerTimes();
    }, [fetchAndSetPrayerTimes]);

    const handleUpdatePrayer = async (prayerName: PrayerName, field: 'isDoneInMosque' | 'notes', value: boolean | string) => {
        if (!user || !firestore) return;
        const id = `${todayString}_${prayerName}`;
        const docRef = doc(firestore, `users/${user.uid}/prayers`, id);
        
        try {
            const dataToUpdate = {
                [field]: value,
                userId: user.uid,
                date: todayString,
                prayerName: prayerName,
                updatedAt: serverTimestamp(),
            };
            await writeBatch(firestore).set(docRef, dataToUpdate, { merge: true }).commit();
        } catch (error) {
            console.error('Error updating prayer:', error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث بيانات الصلاة.' });
        }
    };

    const handleWorshipSubmit = async (data: WorshipFormData) => {
        if (!user || !firestore) return;
        const batch = writeBatch(firestore);
        
        data.acts.forEach(act => {
            const actRef = act.id ? doc(firestore, `users/${user.uid}/worshipActs`, act.id) : doc(collection(firestore, `users/${user.uid}/worshipActs`));
            batch.set(actRef, { ...act, userId: user.uid, date: todayString, createdAt: serverTimestamp() }, { merge: true });
        });

        try {
            await batch.commit();
            toast({ title: 'نجاح', description: 'تم حفظ العبادات بنجاح.' });
        } catch (error) {
            console.error('Error saving worship acts:', error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ العبادات.' });
        }
    };
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">العبادات</h2>
            </div>
            <Card className="bg-card/70 border-primary/20">
                <CardHeader>
                    <CardTitle>حصن المسلم</CardTitle>
                    <CardDescription>
                        بوابتك اليومية للأذكار والأدعية.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="https://remembrances-1.vercel.app/" target="_blank">
                            <ExternalLink className="ml-2 h-4 w-4"/>
                            افتح الأذكار
                        </Link>
                    </Button>
                </CardContent>
            </Card>
             <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>
                        <CardTitle className="text-lg">متابعة الصلوات</CardTitle>
                    </AccordionTrigger>
                    <AccordionContent>
                         <Card className="border-0 shadow-none">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>أوقات صلاة اليوم</CardTitle>
                                        <CardDescription>
                                            {isEditingTimes ? 'عدّل أوقات الصلاة حسب مدينتك' : 'الأوقات تضبط تلقائيًا حسب موقعك'}
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditingTimes(!isEditingTimes)}>
                                        {isEditingTimes ? <Save className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingTimes ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> :
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {prayerNames.map((name) => (
                                            <div key={name} className="space-y-2">
                                                <label className="font-semibold text-lg">{prayerTranslations[name]}</label>
                                                <Input 
                                                    type="time" 
                                                    disabled={!isEditingTimes}
                                                    {...prayerForm.register(`times.${name}`)}
                                                    className="text-center text-lg"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                }
                            </CardContent>
                        </Card>
                        <Card className="mt-4 border-0 shadow-none">
                            <CardHeader>
                                <CardTitle>سجل صلوات اليوم</CardTitle>
                                <CardDescription>سجل أداءك لصلوات اليوم وأضف ملاحظاتك.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isLoadingPrayers ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> :
                                    prayerNames.map(name => {
                                        const currentPrayer = prayerData.get(name);
                                        return (
                                            <div key={name} className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-card border">
                                                <div className="flex items-center gap-4">
                                                    <Landmark className="h-8 w-8 text-primary"/>
                                                    <div>
                                                        <h3 className="text-xl font-bold">{prayerTranslations[name]}</h3>
                                                        <p className="text-muted-foreground text-sm">{prayerForm.getValues(`times.${name}`)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex-grow w-full md:w-auto">
                                                    <Input 
                                                        placeholder="أضف ملاحظة (مثال: خشوع، دعاء...)"
                                                        defaultValue={currentPrayer?.notes || ''}
                                                        onBlur={(e) => handleUpdatePrayer(name, 'notes', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-sm font-medium">صليتها في المسجد؟</span>
                                                    <Button 
                                                        variant={currentPrayer?.isDoneInMosque === true ? 'default' : 'outline'}
                                                        size="icon"
                                                        onClick={() => handleUpdatePrayer(name, 'isDoneInMosque', !(currentPrayer?.isDoneInMosque === true))}
                                                    >
                                                        <Check />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>
                         <CardTitle className="text-lg">عبادات أخرى</CardTitle>
                    </AccordionTrigger>
                    <AccordionContent>
                         <Card className="border-0 shadow-none">
                            <CardHeader>
                                <CardDescription>سجل عباداتك الأخرى مثل قراءة القرآن، الأذكار، الصدقة وغيرها.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...worshipForm}>
                                <form onSubmit={worshipForm.handleSubmit(handleWorshipSubmit)} className="space-y-6">
                                     {isLoadingWorshipActs ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> :
                                        fields.map((field, index) => (
                                             <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                                                <FormField
                                                    control={worshipForm.control}
                                                    name={`acts.${index}.name`}
                                                    render={({ field }) => (
                                                    <FormItem className="flex-1"><FormLabel>العبادة</FormLabel><FormControl><Input placeholder="قراءة قرآن" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={worshipForm.control}
                                                    name={`acts.${index}.count`}
                                                    render={({ field }) => (
                                                    <FormItem><FormLabel>العدد</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={worshipForm.control}
                                                    name={`acts.${index}.notes`}
                                                    render={({ field }) => (
                                                    <FormItem className="flex-1"><FormLabel>ملاحظات</FormLabel><FormControl><Input placeholder="سورة البقرة" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )}
                                                />
                                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ))
                                     }
                                     <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={() => append({ name: '', count: 1, notes: '' })}><Plus className="ml-2 h-4 w-4" /> إضافة عبادة</Button>
                                        <Button type="submit">حفظ العبادات</Button>
                                    </div>
                                </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
