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
import { Loader2, Check, X, Edit2, Save, Mosque } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Prayer } from '@/lib/types';
import { format, startOfDay } from 'date-fns';

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

async function getPrayerTimes(latitude: number, longitude: number) {
    const date = new Date();
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
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<PrayerFormData>({
        resolver: zodResolver(prayerSchema),
        defaultValues: {
            times: { Fajr: '00:00', Dhuhr: '00:00', Asr: '00:00', Maghrib: '00:00', Isha: '00:00' },
        },
    });

    const todayString = format(startOfDay(new Date()), 'yyyy-MM-dd');

    const prayersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/prayers`), where('date', '==', todayString));
    }, [user, firestore, todayString]);

    const { data: prayers, isLoading: isLoadingPrayers } = useCollection<Prayer>(prayersQuery);

    const prayerData = useMemo(() => {
        const map = new Map<PrayerName, Prayer>();
        prayers?.forEach(p => map.set(p.prayerName, p));
        return map;
    }, [prayers]);

    const fetchAndSetPrayerTimes = useCallback(() => {
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const times = await getPrayerTimes(position.coords.latitude, position.coords.longitude);
                    form.reset({
                        times: {
                            Fajr: times.Fajr,
                            Dhuhr: times.Dhuhr,
                            Asr: times.Asr,
                            Maghrib: times.Magrib,
                            Isha: times.Isha,
                        },
                    });
                } catch (error) {
                    toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب أوقات الصلاة تلقائيًا.' });
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحديد موقعك. يرجى إدخال الأوقات يدويًا.' });
                setIsLoading(false);
            }
        );
    }, [form, toast]);

    useEffect(() => {
        fetchAndSetPrayerTimes();
    }, [fetchAndSetPrayerTimes]);

    const handleUpdate = async (prayerName: PrayerName, field: 'isDoneInMosque' | 'notes', value: boolean | string) => {
        if (!user || !firestore) return;
        const id = `${todayString}_${prayerName}`;
        const docRef = doc(firestore, `users/${user.uid}/prayers`, id);
        
        try {
            const batch = writeBatch(firestore);
            const dataToUpdate = {
                [field]: value,
                userId: user.uid,
                date: todayString,
                prayerName: prayerName,
                updatedAt: serverTimestamp(),
            };
            batch.set(docRef, dataToUpdate, { merge: true });
            await batch.commit();
        } catch (error) {
            console.error('Error updating prayer:', error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحديث بيانات الصلاة.' });
        }
    };
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">متابعة الصلوات</h2>
            </div>

            <Card>
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
                    {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> :
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {prayerNames.map((name) => (
                                <div key={name} className="space-y-2">
                                    <label className="font-semibold text-lg">{prayerTranslations[name]}</label>
                                    <Input 
                                        type="time" 
                                        disabled={!isEditingTimes}
                                        {...form.register(`times.${name}`)}
                                        className="text-center text-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    }
                </CardContent>
            </Card>

            <Card>
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
                                        <Mosque className="h-8 w-8 text-primary"/>
                                        <div>
                                            <h3 className="text-xl font-bold">{prayerTranslations[name]}</h3>
                                            <p className="text-muted-foreground text-sm">{form.getValues(`times.${name}`)}</p>
                                        </div>
                                    </div>
                                    <div className="flex-grow w-full md:w-auto">
                                        <Input 
                                            placeholder="أضف ملاحظة (مثال: خشوع، دعاء...)"
                                            defaultValue={currentPrayer?.notes || ''}
                                            onBlur={(e) => handleUpdate(name, 'notes', e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                         <span className="text-sm font-medium">صليتها في المسجد؟</span>
                                        <Button 
                                            variant={currentPrayer?.isDoneInMosque === true ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => handleUpdate(name, 'isDoneInMosque', true)}
                                        >
                                            <Check />
                                        </Button>
                                         <Button 
                                            variant={currentPrayer?.isDoneInMosque === false ? 'destructive' : 'outline'}
                                            size="icon"
                                            onClick={() => handleUpdate(name, 'isDoneInMosque', false)}
                                        >
                                            <X />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })
                     }
                </CardContent>
            </Card>
        </div>
    );
}
