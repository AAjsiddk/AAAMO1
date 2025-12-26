'use client';
import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, where, addDoc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, HeartPulse, Dumbbell, Apple, Info, Utensils, CalendarDays, Edit, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthEntry, ForbiddenFood, Exercise } from '@/lib/types';
import { format } from 'date-fns';
import { ar } from 'date-ns/locale';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { v4 as uuidv4 } from 'uuid';


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

const exerciseSetSchema = z.object({
  reps: z.coerce.number().min(1, "التكرارات مطلوبة"),
  weight: z.coerce.number().min(0, "الوزن مطلوب"),
});

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "اسم التمرين مطلوب"),
  sets: z.array(exerciseSetSchema),
});

const healthEntrySchema = z.object({
  notes: z.string().optional(),
  foodIntake: z.array(foodSchema),
  wentToGym: z.boolean().default(false),
  exercises: z.array(exerciseSchema).optional(),
});

type FormData = z.infer<typeof healthEntrySchema>;

const forbiddenFoodSchema = z.object({
  name: z.string().min(1, "اسم الممنوع مطلوب"),
  reason: z.string().optional(),
});

const todayString = format(new Date(), 'yyyy-MM-dd');

export default function HealthPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [dailyTip, setDailyTip] = useState('');
  const [isForbiddenFoodDialogOpen, setIsForbiddenFoodDialogOpen] = useState(false);
  const [editingForbiddenFood, setEditingForbiddenFood] = useState<ForbiddenFood | null>(null);

  useEffect(() => {
    setDailyTip(healthTips[Math.floor(Math.random() * healthTips.length)]);
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(healthEntrySchema),
    defaultValues: { notes: '', foodIntake: [], wentToGym: false, exercises: [] },
  });

  const forbiddenForm = useForm<z.infer<typeof forbiddenFoodSchema>>({
    resolver: zodResolver(forbiddenFoodSchema),
    defaultValues: { name: '', reason: '' },
  });

  const { fields: foodFields, append: appendFood, remove: removeFood } = useFieldArray({
    control: form.control,
    name: "foodIntake",
  });
  
  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
      control: form.control,
      name: "exercises"
  });


  const healthCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/healthEntries`);
  }, [firestore, user]);

  const allEntriesQuery = useMemoFirebase(() => {
    if (!healthCollectionRef || !user?.uid) return null;
    return query(healthCollectionRef, orderBy('date', 'desc'));
  }, [healthCollectionRef, user?.uid]);
  
  const forbiddenFoodsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `users/${user.uid}/forbiddenFoods`), orderBy('createdAt', 'desc'));
  }, [firestore, user?.uid]);

  const { data: allEntries, isLoading } = useCollection<HealthEntry>(allEntriesQuery);
  const { data: forbiddenFoods, isLoading: isLoadingForbidden } = useCollection<ForbiddenFood>(forbiddenFoodsQuery);

  const selectedEntry = useMemo(() => {
    return allEntries?.find(entry => entry.date === selectedDate);
  }, [allEntries, selectedDate]);

  useEffect(() => {
    if (selectedEntry) {
      form.reset({
        notes: selectedEntry.notes,
        foodIntake: selectedEntry.foodIntake || [],
        wentToGym: selectedEntry.wentToGym,
        exercises: selectedEntry.exercises || [],
      });
    } else {
        form.reset({ notes: '', foodIntake: [], wentToGym: false, exercises: [] });
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

  const handleForbiddenFoodSubmit = async (values: z.infer<typeof forbiddenFoodSchema>) => {
    if (!firestore || !user) return;
    const forbiddenFoodsCollectionRef = collection(firestore, `users/${user.uid}/forbiddenFoods`);
    
    try {
        if (editingForbiddenFood) {
            const docRef = doc(firestore, `users/${user.uid}/forbiddenFoods`, editingForbiddenFood.id);
            await updateDoc(docRef, values);
            toast({title: 'نجاح', description: 'تم تحديث العنصر.'})
        } else {
            await addDoc(forbiddenFoodsCollectionRef, {...values, userId: user.uid, createdAt: serverTimestamp()});
            toast({title: 'نجاح', description: 'تمت إضافة العنصر إلى قائمة الممنوعات.'});
        }
        setIsForbiddenFoodDialogOpen(false);
        setEditingForbiddenFood(null);
        forbiddenForm.reset();
    } catch (error) {
        console.error("Error saving forbidden food: ", error);
        toast({variant: 'destructive', title: 'خطأ', description: 'فشل حفظ العنصر.'})
    }
  };
  
  const handleOpenForbiddenDialog = (food: ForbiddenFood | null) => {
      setEditingForbiddenFood(food);
      if (food) {
          forbiddenForm.reset({name: food.name, reason: food.reason || ''});
      } else {
          forbiddenForm.reset({name: '', reason: ''});
      }
      setIsForbiddenFoodDialogOpen(true);
  }

  const handleDeleteForbiddenFood = async (id: string) => {
      if(!firestore || !user) return;
      const docRef = doc(firestore, `users/${user.uid}/forbiddenFoods`, id);
      try {
        await deleteDoc(docRef);
        toast({title: 'تم الحذف'})
      } catch (error) {
          toast({variant: 'destructive', title: 'خطأ', description: 'فشل حذف العنصر.'})
      }
  }
  
  const addSet = (exerciseIndex: number) => {
      const exercises = form.getValues('exercises') || [];
      const exercise = exercises[exerciseIndex];
      if (exercise) {
        const updatedSets = [...(exercise.sets || []), { reps: 8, weight: 0 }];
        form.setValue(`exercises.${exerciseIndex}.sets`, updatedSets);
      }
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
      const exercises = form.getValues('exercises') || [];
      const exercise = exercises[exerciseIndex];
      if (exercise && exercise.sets) {
        const updatedSets = exercise.sets.filter((_, i) => i !== setIndex);
        form.setValue(`exercises.${exerciseIndex}.sets`, updatedSets);
      }
  };


  return (
    <>
    <Dialog open={isForbiddenFoodDialogOpen} onOpenChange={setIsForbiddenFoodDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingForbiddenFood ? 'تعديل عنصر' : 'إضافة عنصر جديد للممنوعات'}</DialogTitle></DialogHeader>
            <Form {...forbiddenForm}>
                <form onSubmit={forbiddenForm.handleSubmit(handleForbiddenFoodSubmit)} className="space-y-4">
                     <FormField control={forbiddenForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>اسم الممنوع</FormLabel><FormControl><Input placeholder="مثال: مشروبات غازية" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                      <FormField control={forbiddenForm.control} name="reason" render={({ field }) => (
                        <FormItem><FormLabel>السبب (اختياري)</FormLabel><FormControl><Input placeholder="مثال: سكر عالي" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                        <Button type="submit">{editingForbiddenFood ? 'حفظ التعديلات' : 'إضافة'}</Button>
                     </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>


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
                    <Accordion type="multiple" defaultValue={['food', 'gym']} className="w-full">
                       <AccordionItem value="food">
                         <AccordionTrigger className="text-lg font-medium"><Utensils className="ml-2" /> الوجبات</AccordionTrigger>
                         <AccordionContent>
                           <div className="space-y-4 pt-4">
                            {foodFields.map((field, index) => (
                              <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-background/50">
                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={form.control} name={`foodIntake.${index}.meal`} render={({ field }) => (
                                    <FormItem><FormLabel>الوجبة</FormLabel><FormControl><Input placeholder="فطور، غداء..." {...field} disabled={!isToday} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                  <FormField control={form.control} name={`foodIntake.${index}.description`} render={({ field }) => (
                                    <FormItem><FormLabel>الوصف</FormLabel><FormControl><Input placeholder="شوفان وفواكه..." {...field} disabled={!isToday} /></FormControl><FormMessage /></FormItem>
                                  )} />
                                </div>
                                {isToday && <Button type="button" variant="ghost" size="icon" className="mt-8 text-destructive" onClick={() => removeFood(index)}><Trash2 className="h-4 w-4" /></Button>}
                              </div>
                            ))}
                             {foodFields.length === 0 && !isToday && <p className="text-muted-foreground text-center p-4">لم يتم تسجيل وجبات في هذا اليوم.</p>}
                             {isToday && <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => appendFood({ meal: '', description: '' })}><Plus className="h-4 w-4 ml-2" /> إضافة وجبة</Button>}
                          </div>
                         </AccordionContent>
                       </AccordionItem>
                        <AccordionItem value="gym">
                           <AccordionTrigger className="text-lg font-medium"><Dumbbell className="ml-2"/> سجل التمارين</AccordionTrigger>
                           <AccordionContent>
                             <div className="space-y-4 pt-4">
                                {exerciseFields.map((field, index) => (
                                  <Card key={field.id} className="p-4 bg-background/50">
                                    <div className="flex justify-between items-center mb-4">
                                      <FormField control={form.control} name={`exercises.${index}.name`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormLabel>اسم التمرين</FormLabel><FormControl><Input placeholder="مثال: ضغط بنش" {...field} disabled={!isToday} /></FormControl><FormMessage /></FormItem>
                                      )} />
                                      {isToday && <Button type="button" variant="ghost" size="icon" className="mr-2 text-destructive" onClick={() => removeExercise(index)}><Trash2 className="h-4 w-4" /></Button>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>المجموعات</Label>
                                         <Controller
                                            control={form.control}
                                            name={`exercises.${index}.sets`}
                                            render={({ field: { value: sets = [] } }) => (
                                              <>
                                                {sets.map((set, setIndex) => (
                                                  <div key={setIndex} className="flex items-center gap-2">
                                                     <FormField control={form.control} name={`exercises.${index}.sets.${setIndex}.reps`} render={({ field }) => (
                                                        <FormItem className="flex-1"><FormControl><Input type="number" placeholder="التكرار" {...field} disabled={!isToday} /></FormControl></FormItem>
                                                     )}/>
                                                     <FormField control={form.control} name={`exercises.${index}.sets.${setIndex}.weight`} render={({ field }) => (
                                                        <FormItem className="flex-1"><FormControl><Input type="number" placeholder="الوزن" {...field} disabled={!isToday} /></FormControl></FormItem>
                                                     )}/>
                                                     {isToday && <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeSet(index, setIndex)}><Trash2 className="h-4 w-4" /></Button>}
                                                  </div>
                                                ))}
                                              </>
                                            )}
                                          />
                                          {isToday && <Button type="button" variant="outline" size="sm" onClick={() => addSet(index)}><Plus className="h-4 w-4 ml-1"/>إضافة مجموعة</Button>}
                                    </div>
                                  </Card>
                                ))}
                                {exerciseFields.length === 0 && !isToday && <p className="text-muted-foreground text-center p-4">لم يتم تسجيل تمارين في هذا اليوم.</p>}
                                {isToday && <Button type="button" variant="outline" className="mt-4" onClick={() => appendExercise({ id: uuidv4(), name: '', sets: [] })}><Plus className="h-4 w-4 ml-2" /> إضافة تمرين</Button>}
                             </div>
                           </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="mt-6">
                          <FormLabel>ملاحظات صحية عامة</FormLabel>
                          <FormControl><Textarea placeholder="كيف تشعر اليوم؟ هل شربت كمية كافية من الماء؟" {...field} disabled={!isToday} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isToday && 
                        <Button type="submit" disabled={isSubmitting} className="mt-6">
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
                     <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><XCircle className="text-destructive"/> قائمة الممنوعات</CardTitle>
                        <Button variant="outline" size="icon" onClick={() => handleOpenForbiddenDialog(null)}><Plus className="h-4 w-4"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                    {isLoadingForbidden && <Loader2 className="animate-spin" />}
                    {!isLoadingForbidden && (!forbiddenFoods || forbiddenFoods.length === 0) && (
                        <p className="text-muted-foreground text-center text-sm p-4">لا توجد عناصر في قائمة الممنوعات.</p>
                    )}
                    <div className="space-y-2">
                        {forbiddenFoods?.map(food => (
                             <div key={food.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div>
                                    <p className="font-medium">{food.name}</p>
                                    <p className="text-xs text-muted-foreground">{food.reason}</p>
                                </div>
                                <div className="flex">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForbiddenDialog(food)}><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteForbiddenFood(food.id)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info /> كيف أستخدم هذا القسم؟</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                   <p>1. **سجل يومك:** استخدم النموذج لتسجيل وجباتك، تمارينك وملاحظاتك لليوم الحالي فقط.</p>
                   <p>2. **احفظ تقدمك:** اضغط على زر الحفظ في نهاية اليوم لتوثيق كل شيء.</p>
                   <p>3. **تصفح الماضي:** استخدم قائمة "الأيام السابقة" لاستعراض سجلاتك القديمة.</p>
                   <p>4. **قائمة الممنوعات:** أضف الأطعمة أو العادات التي تتجنبها حاليًا لتظل على المسار الصحيح.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    </>
  );
}
