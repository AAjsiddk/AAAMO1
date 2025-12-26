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
import { collection, doc, serverTimestamp, query, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, HeartPulse, Dumbbell, Utensils, CalendarDays, Edit, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { HealthEntry, ForbiddenFood, WorkoutSession, FoodIntake, ExerciseSet, Exercise } from '@/lib/types';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

const healthTips = [
  "اشرب 8 أكواب من الماء يوميًا للحفاظ على رطوبة جسمك.",
  "تناول 5 حصص من الفواكه والخضروات كل يوم.",
  "احرص على النوم لمدة 7-8 ساعات كل ليلة.",
  "مارس التمارين الرياضية لمدة 30 دقيقة على الأقل معظم أيام الأسبوع.",
  "تناول وجبة فطور صحية لبدء يومك بنشاط.",
];

const foodSchema = z.object({
  id: z.string(),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  category: z.enum(['meal', 'supplement']),
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

const workoutSessionSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "عنوان التمرين مطلوب"),
    exercises: z.array(exerciseSchema),
});

const healthEntrySchema = z.object({
  notes: z.string().optional(),
  foodIntake: z.array(foodSchema).optional(),
  workouts: z.array(workoutSessionSchema).optional(),
});

type FormData = z.infer<typeof healthEntrySchema>;

const forbiddenFoodSchema = z.object({
  name: z.string().min(1, "اسم الممنوع مطلوب"),
  reason: z.string().optional(),
});


export default function HealthPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());
  const [dailyTip, setDailyTip] = useState('');
  const [isForbiddenFoodDialogOpen, setIsForbiddenFoodDialogOpen] = useState(false);
  const [editingForbiddenFood, setEditingForbiddenFood] = useState<ForbiddenFood | null>(null);

  useEffect(() => {
    setDailyTip(healthTips[Math.floor(Math.random() * healthTips.length)]);
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(healthEntrySchema),
    defaultValues: { notes: '', foodIntake: [], workouts: [] },
  });

  const forbiddenForm = useForm<z.infer<typeof forbiddenFoodSchema>>({
    resolver: zodResolver(forbiddenFoodSchema),
    defaultValues: { name: '', reason: '' },
  });

  const { fields: foodFields, append: appendFood, remove: removeFood } = useFieldArray({ control: form.control, name: "foodIntake" });
  const { fields: workoutFields, append: appendWorkout, remove: removeWorkout } = useFieldArray({ control: form.control, name: "workouts" });
  
  const healthEntriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, `users/${user.uid}/healthEntries`);
  }, [firestore, user?.uid]);
  
  const forbiddenFoodsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `users/${user.uid}/forbiddenFoods`));
  }, [firestore, user?.uid]);

  const { data: allEntries, isLoading } = useCollection<HealthEntry>(healthEntriesQuery);
  const { data: forbiddenFoods, isLoading: isLoadingForbidden } = useCollection<ForbiddenFood>(forbiddenFoodsQuery);

  const selectedDate = useMemo(() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const date = addDays(today, selectedDayIndex - dayOfWeek);
      return format(date, 'yyyy-MM-dd');
  }, [selectedDayIndex]);

  const selectedEntry = useMemo(() => {
    return allEntries?.find(entry => entry.date === selectedDate);
  }, [allEntries, selectedDate]);
  
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (selectedEntry) {
      form.reset({
        notes: selectedEntry.notes || '',
        foodIntake: selectedEntry.foodIntake || [],
        workouts: selectedEntry.workouts || [],
      });
    } else {
      form.reset({ notes: '', foodIntake: [], workouts: [] });
    }
  }, [selectedEntry, form]);

  const onSubmit = async (values: FormData) => {
    if (!firestore || !user) return;
    
    try {
      const entryData = {
        ...values,
        userId: user.uid,
        date: selectedDate,
        updatedAt: serverTimestamp(),
      };

      const entryDocRef = doc(firestore, `users/${user.uid}/healthEntries`, selectedDate);
      
      await setDoc(entryDocRef, { ...entryData, createdAt: selectedEntry?.createdAt || serverTimestamp() }, { merge: true });
      toast({ title: 'نجاح', description: `تم تحديث سجل يوم ${format(new Date(selectedDate), 'EEEE', {locale: ar})}.` });

    } catch (error) {
      console.error("Error saving health entry: ", error);
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل حفظ السجل الصحي.` });
    }
  };

  const handleForbiddenFoodSubmit = async (values: z.infer<typeof forbiddenFoodSchema>) => {
    if (!firestore || !user) return;
    const forbiddenFoodsCollectionRef = collection(firestore, `users/${user.uid}/forbiddenFoods`);
    const docId = editingForbiddenFood ? editingForbiddenFood.id : uuidv4();
    const docRef = doc(firestore, `users/${user.uid}/forbiddenFoods`, docId);
    
    try {
        await setDoc(docRef, {...values, userId: user.uid, createdAt: editingForbiddenFood?.createdAt || serverTimestamp() }, {merge: true});
        toast({title: 'نجاح', description: `تم ${editingForbiddenFood ? 'تحديث' : 'إضافة'} العنصر.`});
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
      forbiddenForm.reset(food ? {name: food.name, reason: food.reason || ''} : {name: '', reason: ''});
      setIsForbiddenFoodDialogOpen(true);
  }

  const handleDeleteForbiddenFood = async (id: string) => {
      if(!firestore || !user) return;
      try {
        await deleteDoc(doc(firestore, `users/${user.uid}/forbiddenFoods`, id));
        toast({title: 'تم الحذف'})
      } catch (error) {
          toast({variant: 'destructive', title: 'خطأ', description: 'فشل حذف العنصر.'})
      }
  }

  const addExercise = (workoutIndex: number) => {
      const workouts = form.getValues('workouts') || [];
      const workout = workouts[workoutIndex];
      if (workout) {
        const updatedExercises = [...(workout.exercises || []), { id: uuidv4(), name: '', sets: [{ reps: 8, weight: 0 }] }];
        form.setValue(`workouts.${workoutIndex}.exercises`, updatedExercises, { shouldDirty: true });
      }
  };
  
  const removeExercise = (workoutIndex: number, exerciseIndex: number) => {
      const exercises = form.getValues(`workouts.${workoutIndex}.exercises`) || [];
      const updatedExercises = exercises.filter((_, i) => i !== exerciseIndex);
      form.setValue(`workouts.${workoutIndex}.exercises`, updatedExercises, { shouldDirty: true });
  };
  
  const addSet = (workoutIndex: number, exerciseIndex: number) => {
      const exercises = form.getValues(`workouts.${workoutIndex}.exercises`);
      const exercise = exercises?.[exerciseIndex];
      if (exercise) {
        const updatedSets = [...(exercise.sets || []), { reps: 8, weight: 0 }];
        form.setValue(`workouts.${workoutIndex}.exercises.${exerciseIndex}.sets`, updatedSets, { shouldDirty: true });
      }
  };

  const removeSet = (workoutIndex: number, exerciseIndex: number, setIndex: number) => {
      const sets = form.getValues(`workouts.${workoutIndex}.exercises.${exerciseIndex}.sets`);
      const updatedSets = sets?.filter((_, i) => i !== setIndex);
      form.setValue(`workouts.${workoutIndex}.exercises.${exerciseIndex}.sets`, updatedSets, { shouldDirty: true });
  };

  const weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

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
              سجل يوم {weekDays[selectedDayIndex]}
              </CardTitle>
              <CardDescription>
                سجل وجباتك، نشاطك الرياضي وملاحظاتك الصحية لهذا اليوم.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-medium flex items-center gap-2"><Utensils /> الوجبات</h3>
                        {foodFields.map((field, index) => (
                          <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-background/50">
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                               <FormField control={form.control} name={`foodIntake.${index}.type`} render={({ field }) => (
                                    <FormItem><FormLabel>الوجبة</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="breakfast">فطور</SelectItem><SelectItem value="lunch">غداء</SelectItem><SelectItem value="dinner">عشاء</SelectItem><SelectItem value="snack">وجبة خفيفة</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name={`foodIntake.${index}.category`} render={({ field }) => (
                                    <FormItem><FormLabel>الصنف</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="meal">وجبة عادية</SelectItem><SelectItem value="supplement">مكمل غذائي</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                                )}/>
                              <FormField control={form.control} name={`foodIntake.${index}.description`} render={({ field }) => (
                                <FormItem><FormLabel>الوصف</FormLabel><FormControl><Input placeholder="شوفان وفواكه..." {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="mt-8 text-destructive" onClick={() => removeFood(index)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                         {foodFields.length === 0 && <p className="text-muted-foreground text-center p-4">لم يتم تسجيل وجبات.</p>}
                         <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => appendFood({ id: uuidv4(), type: 'lunch', category: 'meal', description: '' })}><Plus className="h-4 w-4 ml-2" /> إضافة وجبة</Button>
                      </div>
                      
                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-medium flex items-center gap-2"><Dumbbell/> سجل التمارين</h3>
                           {workoutFields.map((workoutField, workoutIndex) => (
                               <Card key={workoutField.id} className="p-4 bg-muted/30">
                                   <div className="flex justify-between items-center mb-4">
                                       <FormField control={form.control} name={`workouts.${workoutIndex}.title`} render={({ field }) => (
                                           <FormItem className="flex-1"><FormLabel>عنوان جلسة التمرين (مثال: تمرين صدر)</FormLabel><FormControl><Input placeholder="عنوان الجلسة" {...field} /></FormControl><FormMessage /></FormItem>
                                       )} />
                                       <Button type="button" variant="ghost" size="icon" className="mr-2 mt-8 text-destructive" onClick={() => removeWorkout(workoutIndex)}><Trash2 className="h-4 w-4" /></Button>
                                   </div>
                                    <Controller
                                        control={form.control}
                                        name={`workouts.${workoutIndex}.exercises`}
                                        render={({ field: { value: exercises = [] } }) => (
                                          <div className="space-y-3">
                                            {exercises.map((exercise, exerciseIndex) => (
                                                <Card key={exercise.id} className="p-3 bg-background/50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <FormField control={form.control} name={`workouts.${workoutIndex}.exercises.${exerciseIndex}.name`} render={({ field }) => (
                                                            <FormItem className="flex-1"><FormLabel>التمرين (مثال: ضغط بنش)</FormLabel><FormControl><Input placeholder="اسم التمرين" {...field}/></FormControl><FormMessage/></FormItem>
                                                        )}/>
                                                        <Button type="button" variant="ghost" size="icon" className="mr-2 mt-8 text-destructive" onClick={() => removeExercise(workoutIndex, exerciseIndex)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                    <Label className="mb-2 block">المجموعات</Label>
                                                    <div className="space-y-2">
                                                    <Controller
                                                        control={form.control}
                                                        name={`workouts.${workoutIndex}.exercises.${exerciseIndex}.sets`}
                                                        render={({ field: { value: sets = [] } }) => sets.map((set, setIndex) => (
                                                            <div key={setIndex} className="flex items-center gap-2">
                                                                <FormField control={form.control} name={`workouts.${workoutIndex}.exercises.${exerciseIndex}.sets.${setIndex}.reps`} render={({field}) => (<FormItem className="flex-1"><FormControl><Input type="number" placeholder="التكرار" {...field}/></FormControl></FormItem>)}/>
                                                                <FormField control={form.control} name={`workouts.${workoutIndex}.exercises.${exerciseIndex}.sets.${setIndex}.weight`} render={({field}) => (<FormItem className="flex-1"><FormControl><Input type="number" placeholder="الوزن" {...field}/></FormControl></FormItem>)}/>
                                                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeSet(workoutIndex, exerciseIndex, setIndex)}><Trash2 className="h-4 w-4"/></Button>
                                                            </div>
                                                        ))}
                                                    />
                                                    </div>
                                                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addSet(workoutIndex, exerciseIndex)}><Plus className="h-4 w-4 ml-1"/>إضافة مجموعة</Button>
                                                </Card>
                                            ))}
                                          </div>
                                        )}
                                      />
                                   <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => addExercise(workoutIndex)}><Plus className="h-4 w-4 ml-1"/>إضافة تمرين</Button>
                               </Card>
                           ))}
                           {workoutFields.length === 0 && <p className="text-muted-foreground text-center p-4">لم يتم تسجيل جلسات تمارين.</p>}
                           <Button type="button" variant="outline" className="mt-4" onClick={() => appendWorkout({ id: uuidv4(), title: '', exercises: [] })}><Plus className="h-4 w-4 ml-2" /> إضافة جلسة تمرين</Button>
                      </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="mt-6">
                          <FormLabel>ملاحظات صحية عامة</FormLabel>
                          <FormControl><Textarea placeholder="كيف تشعر اليوم؟ هل شربت كمية كافية من الماء؟" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSubmitting} className="mt-6">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    {selectedEntry ? 'تحديث سجل اليوم' : 'حفظ سجل اليوم'}
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
                    <CardTitle className="flex items-center gap-2"><CalendarDays /> أيام الأسبوع</CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                        {weekDays.map((day, index) => (
                            <Button key={day} variant={selectedDayIndex === index ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedDayIndex(index)}>
                                {day}
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
                     <CardDescription>الأطعمة التي يجب عليك تجنبها.</CardDescription>
                </CardHeader>
                <CardContent className="max-h-60 overflow-y-auto">
                    {isLoadingForbidden ? <Loader2 className="animate-spin" />
                    : !forbiddenFoods || forbiddenFoods.length === 0 ? (
                        <p className="text-muted-foreground text-center text-sm p-4">قائمة الممنوعات فارغة.</p>
                    ) : (
                        <div className="space-y-2">
                            {forbiddenFoods?.map(food => (
                                 <div key={food.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                                    <div>
                                        <p className="font-semibold">{food.name}</p>
                                        {food.reason && <p className="text-xs text-muted-foreground">{food.reason}</p>}
                                    </div>
                                    <div className="flex">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForbiddenDialog(food)}><Edit className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteForbiddenFood(food.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    </>
  );
}

    