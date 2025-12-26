'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Edit, PlusCircle, RotateCcw, Trash2, Award, Star, Trophy, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as AllIcons from 'lucide-react';
import { useForm } from 'react-hook-form';

type Challenge = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof AllIcons;
  color: string;
  achievedAt?: string;
  isCustom: boolean;
};

const defaultChallenges: Omit<Challenge, 'id' | 'isCustom'>[] = [
  { title: 'المبادر', description: 'أكملت مهمتك الأولى بنجاح.', icon: 'Star', color: 'text-yellow-400' },
  { title: 'المنظم الأسبوعي', description: 'أضفت 5 مهام في أسبوع واحد.', icon: 'Award', color: 'text-blue-400' },
  { title: 'سيد التركيز', description: 'استخدمت وضع التركيز لمدة ساعة كاملة.', icon: 'Zap', color: 'text-purple-400' },
  { title: 'صانع العادات', description: 'حافظت على سلسلة التزام لمدة 7 أيام متتالية.', icon: 'Trophy', color: 'text-green-400' },
];

const challengeSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  description: z.string().min(1, 'الوصف مطلوب'),
  icon: z.string().min(1, 'الأيقونة مطلوبة'),
});

const ConfettiPiece = ({ x, y, rotation, color }: { x: number; y: number; rotation: number, color: string }) => (
  <motion.div
    style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, backgroundColor: color, width: '8px', height: '16px', rotate: rotation, borderRadius: '2px' }}
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
    exit={{ opacity: 0, y: 20, transition: { duration: 0.5 } }}
  />
);

const ConfettiBackground = () => {
  const colors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'];
  const confetti = useMemo(() => Array.from({ length: 100 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, rotation: Math.random() * 360, color: colors[Math.floor(Math.random() * colors.length)]
  })), []);
  return <div className="absolute inset-0 z-0 overflow-hidden">{confetti.map(c => <ConfettiPiece key={c.id} x={c.x} y={c.y} rotation={c.rotation} color={c.color} />)}</div>;
};

const IconPicker = ({ onSelect, selectedIcon }: { onSelect: (iconName: string) => void; selectedIcon: string }) => {
  const iconList = ['Star', 'Award', 'Trophy', 'Zap', 'Gift', 'Heart', 'Rocket', 'Flag', 'Shield', 'Target', 'Sun', 'Moon', 'BookOpen'];
  return (
    <div className="grid grid-cols-6 gap-2 border p-2 rounded-md max-h-48 overflow-y-auto">
      {iconList.map(iconName => {
        const IconComponent = (AllIcons as any)[iconName];
        if (!IconComponent) return null;
        return (
          <button key={iconName} type="button" onClick={() => onSelect(iconName)} className={`p-2 rounded-md flex justify-center items-center ${selectedIcon === iconName ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <IconComponent className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
};

export default function ChallengesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [completed, setCompleted] = useState<string[]>(['starter']);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  const form = useForm<z.infer<typeof challengeSchema>>({ resolver: zodResolver(challengeSchema), defaultValues: { title: '', description: '', icon: 'Star' } });

  const challengesCollectionRef = useMemoFirebase(() => user ? collection(firestore, `users/${user.uid}/challenges`) : null, [user, firestore]);
  const { data: customChallenges, isLoading } = useCollection<Challenge>(challengesCollectionRef);

  const allChallenges = useMemo(() => {
    const staticChallenges = defaultChallenges.map((c, i) => ({ ...c, id: `static-${i}`, isCustom: false }));
    const challenges = [...staticChallenges, ...(customChallenges || [])];
    return challenges;
  }, [customChallenges]);

  const handleToggle = (id: string) => {
    setCompleted((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleOpenDialog = (challenge: Challenge | null) => {
    setEditingChallenge(challenge);
    if (challenge) {
      form.reset({ title: challenge.title, description: challenge.description, icon: challenge.icon });
    } else {
      form.reset({ title: '', description: '', icon: 'Star' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof challengeSchema>) => {
    if (!challengesCollectionRef || !user) return;
    try {
      const challengeData = {
        ...values,
        color: 'text-gray-400',
        isCustom: true,
      };
      if (editingChallenge) {
        const docRef = doc(firestore, `users/${user.uid}/challenges`, editingChallenge.id);
        await updateDoc(docRef, challengeData);
        toast({ title: 'نجاح', description: 'تم تحديث الإنجاز.' });
      } else {
        await addDoc(challengesCollectionRef, { ...challengeData, userId: user.uid, createdAt: serverTimestamp() });
        toast({ title: 'نجاح', description: 'تمت إضافة إنجاز جديد.' });
      }
      setIsDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ الإنجاز.' });
    }
  };

  const handleDelete = async (challengeId: string) => {
    if (!challengesCollectionRef) return;
    try {
      await deleteDoc(doc(challengesCollectionRef, challengeId));
      toast({ title: 'نجاح', description: 'تم حذف الإنجاز.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الإنجاز.' });
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingChallenge ? 'تعديل الإنجاز' : 'إضافة إنجاز جديد'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>عنوان الإنجاز</FormLabel><FormControl><Input placeholder="مثال: خبير القراءة" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea placeholder="صف الإنجاز الذي حققته" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="icon" render={({ field }) => (
                <FormItem>
                  <FormLabel>اختر أيقونة</FormLabel>
                  <IconPicker onSelect={field.onChange} selectedIcon={field.value} />
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                <Button type="submit">{editingChallenge ? 'حفظ التعديلات' : 'إضافة'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gray-900 text-white relative overflow-hidden min-h-screen">
        <AnimatePresence>{completed.length > 0 && <ConfettiBackground />}</AnimatePresence>
        <div className="relative z-10">
          <div className="flex items-center justify-between space-y-2 mb-8">
            <h2 className="text-3xl font-bold tracking-tight">الإنجازات والتحديات</h2>
            <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="ml-2 h-4 w-4"/> إضافة إنجاز</Button>
          </div>
          <p className="text-muted-foreground mb-8">احتفل بإنجازاتك وتحدياتك التي أكملتها.</p>

          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allChallenges.map((challenge, index) => {
                const isCompleted = completed.includes(challenge.id);
                const IconComponent = (AllIcons as any)[challenge.icon] || Star;
                return (
                  <motion.div key={challenge.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 text-white flex flex-col h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{challenge.title}</CardTitle>
                          <div className={`p-3 rounded-full bg-gray-700 ${challenge.color}`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground">{challenge.description}</p>
                      </CardContent>
                      <CardFooter className="flex-col sm:flex-row gap-2">
                        {challenge.isCustom && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(challenge)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(challenge.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        )}
                        <Button className={`w-full font-bold transition-all duration-300 ${isCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'}`} onClick={() => handleToggle(challenge.id)}>
                          {isCompleted ? <><RotateCcw className="ml-2 h-4 w-4" /> تراجع</> : <><Check className="ml-2 h-4 w-4" /> إكمال</>}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
