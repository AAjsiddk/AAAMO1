'use client';
import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, where, addDoc, updateDoc, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, HeartPulse, Dumbbell, Apple, Info, Utensils, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthEntry } from '@/lib/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';


const healthTips = [
  "اشرب 8 أكواب من الماء يوميًا للحفاظ على رطوبة جسمك.",
  "تناول 5 حصص من الفواكه والخضروات كل يوم.",
  "احرص على النوم لمدة 7-8 ساعات كل ليلة.",
  "مارس التمارين الرياضية لمدة 30 دقيقة على الأقل معظم أيام الأسبوع.",
  "تناول وجبة فطور صحية لبدء يومك بنشاط.",
  "قلل من تناول السكريات المصنعة والدهون المشبعة.",
  "تجنب الأكل قبل النوم مباشرة بساعتين على الأقل.",
  "امضغ طعامك ببطء للاستمتاع به وتحسين الهضم.",
  "تأكد من الحصول على ما يكفي من البروتين في نظامك الغذائي.",
  "خصص وقتًا للاسترخاء والتأمل لتقليل التوتر.",
];


const foodSchema = z.object({
  meal: z.string().min(1, "اسم الوجبة مطلوب"),
  description: z.string().min(1, "وصف الوجبة مطلوب"),
});

const healthEntrySchema = z.object({
  notes: z.string().optional(),
  foodIntake: z.array(foodSchema),
  wentToGym: z.boolean().default(false),
});

type FormData = z.infer<typeof healthEntrySchema>;

const todayString = format(new Date(), 'yyyy-MM-dd');

export default function HealthPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [dailyTip, setDailyTip] = useState('');

  useEffect(() => {
    setDailyTip(healthTips[Math.floor(Math.random() * healthTips.length)]);
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(healthEntrySchema),
    defaultValues: { notes: '', foodIntake: [], wentToGym: false },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "foodIntake",
  });

  const healthCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/healthEntries`);
  }, [firestore, user]);

  const allEntriesQuery = useMemoFirebase(() => {
    if (!healthCollectionRef || !user?.uid) return null;
    return query(healthCollectionRef, orderBy('date', 'desc'));
  }, [healthCollectionRef, user?.uid]);
  
  const { data: allEntries, isLoading } = useCollection<HealthEntry>(allEntriesQuery);

  const selectedEntry = useMemo(() => {
    return allEntries?.find(entry => entry.date === selectedDate);
  }, [allEntries, selectedDate]);

  useEffect(() => {
    if (selectedEntry) {
      form.reset({
        notes: selectedEntry.notes,
        foodIntake: selectedEntry.foodIntake,
        wentToGym: selectedEntry.wentToGym,
      });
    } else {
        form.reset({ notes: '', foodIntake: [], wentToGym: false });
    }
  }, [selectedEntry, form, selectedDate]);
  
   const isToday = selectedDate === todayString;

  const onSubmit = async (values: FormData) => {
    if (!healthCollectionRef || !user) return;
    if (!isToday) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكنك تعديل سجل يوم سابق.' });
        return;
    }
    setIsSubmitting(true);
    
    try {
      const entryData = {
        ...values,
        userId: user.uid,
        date: todayString,
        updatedAt: serverTimestamp(),
      };

      if (selectedEntry) {
        const entryDocRef = doc(firestore, `users/${user.uid}/healthEntries`, selectedEntry.id);
        await updateDoc(entryDocRef, entryData);
        toast({ title: 'نجاح', description: 'تم تحديث سجل اليوم الصحي.' });
      } else {
        await addDoc(healthCollectionRef, { ...entryData, createdAt: serverTimestamp() });
        toast({ title: 'نجاح', description: 'تم تسجيل بيانات اليوم الصحية.' });
      }
    } catch (error) {
      console.error("Error saving health entry: ", error);
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل حفظ السجل الصحي.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الصحة والغذاء</h2>
      </div>

       <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
                 <p className="font-semibold text-primary">{dailyTip}</p>
            </CardContent>
        </Card>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'><HeartPulse className="text-primary"/> 
              سجل يوم {format(new Date(selectedDate.replace(/-/g, '/')), 'd MMMM yyyy', { locale: ar })}
              </CardTitle>
              <CardDescription>
                {isToday ? 'سجل وجباتك، نشاطك الرياضي وملاحظاتك الصحية لهذا اليوم.' : 'عرض سجل يوم سابق.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><Utensils /> الوجبات</h3>
                      <div className="space-y-4">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-background/50">
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`foodIntake.${index}.meal`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الوجبة</FormLabel>
                                    <FormControl><Input placeholder="فطور، غداء..." {...field} disabled={!isToday} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`foodIntake.${index}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الوصف</FormLabel>
                                    <FormControl><Input placeholder="شوفان وفواكه..." {...field} disabled={!isToday} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            {isToday && 
                                <Button type="button" variant="ghost" size="icon" className="mt-8 text-destructive" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            }
                          </div>
                        ))}
                         {fields.length === 0 && !isToday && <p className="text-muted-foreground text-center p-4">لم يتم تسجيل وجبات في هذا اليوم.</p>}
                      </div>
                      {isToday && 
                        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ meal: '', description: '' })}>
                            <Plus className="h-4 w-4 ml-2" /> إضافة وجبة
                        </Button>
                      }
                    </div>

                    <FormField
                      control={form.control}
                      name="wentToGym"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2"><Dumbbell /> هل ذهبت إلى الجيم؟</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!isToday} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات صحية عامة</FormLabel>
                          <FormControl><Textarea placeholder="كيف تشعر اليوم؟ هل شربت كمية كافية من الماء؟" {...field} disabled={!isToday} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isToday && 
                        <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                        {selectedEntry ? 'تحديث سجل اليوم' : 'حفظ سجل اليوم'}
                        </Button>
                    }
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarDays /> الأيام السابقة</CardTitle>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                        {isLoading && <Loader2 className="animate-spin"/>}
                        {allEntries?.map(entry => (
                            <Button key={entry.id} variant={selectedDate === entry.date ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedDate(entry.date)}>
                                {format(new Date(entry.date.replace(/-/g, '/')), 'EEEE, d MMMM yyyy', { locale: ar })}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info /> كيف أستخدم هذا القسم؟</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                   <p>1. **سجل يومك:** استخدم النموذج لتسجيل وجباتك، نشاطك الرياضي وملاحظاتك لليوم الحالي فقط.</p>
                   <p>2. **احفظ تقدمك:** اضغط على زر الحفظ في نهاية اليوم لتوثيق كل شيء.</p>
                   <p>3. **تصفح الماضي:** استخدم قائمة "الأيام السابقة" لاستعراض سجلاتك القديمة.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
