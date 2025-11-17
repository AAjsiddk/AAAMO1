'use client';
import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, HeartPulse, Dumbbell, Apple, CircleHelp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthEntry } from '@/lib/types';
import { format, subDays, startOfDay } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  const todayEntryQuery = useMemoFirebase(() => {
    if (!healthCollectionRef) return null;
    return query(healthCollectionRef, where('date', '==', todayString), where("userId", "==", user?.uid));
  }, [healthCollectionRef, user?.uid]);
  
  const { data: todayEntries, isLoading } = useCollection<HealthEntry>(todayEntryQuery);
  const todayEntry = todayEntries?.[0];

  useState(() => {
    if (todayEntry) {
      form.reset({
        notes: todayEntry.notes,
        foodIntake: todayEntry.foodIntake,
        wentToGym: todayEntry.wentToGym,
      });
    }
  });

  const onSubmit = async (values: FormData) => {
    if (!healthCollectionRef || !user) return;
    setIsSubmitting(true);
    
    try {
      const entryData = {
        ...values,
        userId: user.uid,
        date: todayString,
        createdAt: serverTimestamp(),
      };

      if (todayEntry) {
        const entryDocRef = doc(firestore, `users/${user.uid}/healthEntries`, todayEntry.id);
        await updateDoc(entryDocRef, values);
        toast({ title: 'نجاح', description: 'تم تحديث سجل اليوم الصحي.' });
      } else {
        await addDoc(healthCollectionRef, entryData);
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
      
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'><HeartPulse className="text-primary"/> سجل اليوم الصحي</CardTitle>
              <CardDescription>سجل وجباتك، نشاطك الرياضي وملاحظاتك الصحية ليوم {todayString}.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><Apple /> الوجبات</h3>
                      <div className="space-y-4">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md">
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`foodIntake.${index}.meal`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الوجبة</FormLabel>
                                    <FormControl><Input placeholder="فطور، غداء..." {...field} /></FormControl>
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
                                    <FormControl><Input placeholder="شوفان وفواكه..." {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="mt-8" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ meal: '', description: '' })}>
                        <Plus className="h-4 w-4 ml-2" /> إضافة وجبة
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="wentToGym"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2"><Dumbbell /> هل ذهبت إلى الجيم اليوم؟</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                          <FormControl><Textarea placeholder="كيف تشعر اليوم؟ هل شربت كمية كافية من الماء؟" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                      {todayEntry ? 'تحديث سجل اليوم' : 'حفظ سجل اليوم'}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نصائح وقوائم</CardTitle>
              <CardDescription>قوائم مخصصة لمساعدتك في رحلتك الصحية.</CardDescription>
            </CardHeader>
            <CardContent>
               <Accordion type="multiple" className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>أطعمة يُنصح بها</AccordionTrigger>
                  <AccordionContent>
                    هنا يمكنك إضافة قائمة بالأطعمة التي ترغب في التركيز عليها. (ميزة قيد التطوير)
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>أطعمة يجب تجنبها</AccordionTrigger>
                  <AccordionContent>
                    هنا يمكنك إضافة قائمة بالأطعمة التي تريد تجنبها أو التقليل منها. (ميزة قيد التطوير)
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger>تمارين مقترحة</AccordionTrigger>
                  <AccordionContent>
                    قائمة بتمارينك المفضلة أو التي تخطط للقيام بها. (ميزة قيد التطوير)
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CircleHelp /> كيف أستخدم هذا القسم؟</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                   <p>1. **سجل وجباتك:** اضغط "إضافة وجبة" لتوثيق ما أكلته.</p>
                   <p>2. **تابع نشاطك:** فعّل خيار "هل ذهبت إلى الجيم اليوم؟" لتسجيل نشاطك.</p>
                   <p>3. **دوّن ملاحظاتك:** استخدم حقل الملاحظات لكتابة أي شيء يتعلق بصحتك.</p>
                   <p>4. **احفظ تقدمك:** اضغط على زر الحفظ في نهاية اليوم لتوثيق كل شيء.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
