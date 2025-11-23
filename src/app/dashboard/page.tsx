'use client';
import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Task, Goal, Habit, JournalEntry, Inspiration } from '@/lib/types';
import { Loader2, ArrowLeft, Lightbulb, RefreshCw } from 'lucide-react';
import { TimeWidget } from "@/components/dashboard/time-widget";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

const tasbeehOptions = [
  "سبحان الله",
  "الحمد لله",
  "لا إله إلا الله",
  "الله أكبر",
  "سبحان الله وبحمده",
  "سبحان الله العظيم",
  "لا حول ولا قوة إلا بالله",
  "أستغفر الله",
  "اللهم صل على محمد",
];


const wisdoms = [
  { type: "آية", text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ" },
  { type: "حديث", text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى." },
  { type: "حكمة", text: "العلم في الصغر كالنقش على الحجر." },
  { type: "آية", text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ" },
  { type: "حديث", text: "الكلمة الطيبة صدقة." },
  { type: "حكمة", text: "الصبر مفتاح الفرج." },
  { type: "آية", text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا" },
];

const DashboardPage = () => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [tasbeehCount, setTasbeehCount] = useState(0);
  const [currentTasbeeh, setCurrentTasbeeh] = useState(tasbeehOptions[0]);
  const [tasbeehTarget, setTasbeehTarget] = useState(33);
  const [currentWisdom, setCurrentWisdom] = useState(wisdoms[0]);

  const tasksQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/tasks`), orderBy('updatedAt', 'desc'), limit(10)) : null), [user, firestore]);
  const goalsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/goals`) : null), [user, firestore]);
  const habitsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/habits`) : null), [user, firestore]);
  const journalQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/journalEntries`), orderBy('createdAt', 'desc'), limit(3)) : null), [user, firestore]);

  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksQuery);
  const { data: goals, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery);
  const { data: habits, isLoading: loadingHabits } = useCollection<Habit>(habitsQuery);
  const { data: journalEntries, isLoading: loadingJournal } = useCollection<JournalEntry>(journalQuery);

  const isLoading = loadingTasks || loadingGoals || loadingHabits || loadingJournal;

  const tasksCompletedWeeklyData = useMemo(() => {
    if (!tasks) return [];
    const weekCounts = Array(7).fill(0).map((_, i) => ({
        name: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][i],
        completed: 0,
    }));

    tasks.forEach(task => {
        if (task.status === 'completed' && task.updatedAt) {
            const date = (task.updatedAt as Timestamp)?.toDate();
            if (date) {
                const dayOfWeek = date.getDay();
                weekCounts[dayOfWeek].completed++;
            }
        }
    });
    return weekCounts;
  }, [tasks]);

  const stats = useMemo(() => ({
    tasksCompleted: tasks?.filter(t => t.status === 'completed').length || 0,
    activeGoals: goals?.filter(g => (g.progress || 0) < 100).length || 0,
    activeHabits: habits?.length || 0,
  }), [tasks, goals, habits]);
  
  const handleTasbeehClick = () => {
    if (tasbeehCount + 1 === tasbeehTarget) {
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        setTasbeehCount(0);
    } else {
        setTasbeehCount(tasbeehCount + 1);
    }
  };

  const getNewWisdom = () => {
    const newWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
    setCurrentWisdom(newWisdom);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">لوحة التحكم</h2>
            <p className="text-muted-foreground">نظرة عامة على عالمك الشخصي.</p>
        </div>
      </motion.div>
      
       <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="bg-card/70 border-border/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>{currentWisdom.type} اليوم</span>
                         <Button variant="ghost" size="icon" onClick={getNewWisdom}><RefreshCw className="h-4 w-4"/></Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg font-semibold text-center">"{currentWisdom.text}"</p>
                </CardContent>
            </Card>
        </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="h-full bg-card/70 border-border/50 backdrop-blur-sm">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الوقت الحالي</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <TimeWidget/>
                 </CardContent>
            </Card>
        </motion.div>
        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
             <Card className="bg-card/70 border-border/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المهام المنجزة (آخر 10)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.tasksCompleted}</div>
                </CardContent>
            </Card>
        </motion.div>
         <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="bg-card/70 border-border/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الأهداف النشطة</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.activeGoals}</div>
                </CardContent>
            </Card>
        </motion.div>
         <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="bg-card/70 border-border/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">العادات قيد التتبع</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.activeHabits}</div>
                </CardContent>
            </Card>
        </motion.div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants} className="lg:col-span-4">
            <Card className="h-full bg-card/70 border-border/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>الإنتاجية الأسبوعية</CardTitle>
                <CardDescription>عدد المهام التي أنجزتها خلال هذا الأسبوع.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                 <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={tasksCompletedWeeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}/>
                        <Legend />
                        <Bar dataKey="completed" fill="hsl(var(--primary))" name="المهام المنجزة" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
         </motion.div>
         <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants} className="lg:col-span-3">
             <Card className="h-full bg-card/70 border-border/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>آخر المذكرات</CardTitle>
                        <CardDescription>أحدث ما قمت بتدوينه.</CardDescription>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/dashboard/journal">
                             الكل <ArrowLeft className="mr-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                 {loadingJournal ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                 ) : journalEntries && journalEntries.length > 0 ? (
                    <div className="space-y-4">
                        {journalEntries.map(entry => (
                            <div key={entry.id} className="p-3 bg-card/80 rounded-lg hover:bg-card transition-colors">
                                <h4 className="font-semibold truncate">{entry.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">{entry.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {(entry.createdAt as Timestamp)?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <p className="text-center text-muted-foreground py-10">لا توجد مذكرات بعد.</p>
                 )}
              </CardContent>
            </Card>
         </motion.div>
      </div>

       <div className="grid gap-4 md:grid-cols-2">
         <motion.div custom={7} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="bg-card/70 border-border/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold text-primary">السبحة الإلكترونية</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-6">
                    <p className="text-lg text-muted-foreground">التسبيح الحالي: <span className="font-bold text-foreground">{currentTasbeeh}</span></p>
                     <div 
                        className="w-48 h-48 rounded-full bg-gradient-to-br from-background to-card flex items-center justify-center text-6xl font-bold cursor-pointer select-none border-4 border-primary/50 shadow-lg active:scale-95 transition-transform"
                        onClick={handleTasbeehClick}
                    >
                        {tasbeehCount}
                    </div>
                    <div className="w-full max-w-sm flex flex-col gap-4">
                         <div>
                            <label className="text-muted-foreground mb-2 block">اختر نوع التسبيح:</label>
                            <Select defaultValue={currentTasbeeh} onValueChange={setCurrentTasbeeh}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر نوع التسبيح" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tasbeehOptions.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                             <label className="text-muted-foreground mb-2 block">الهدف:</label>
                            <Input
                                type="number"
                                value={tasbeehTarget}
                                onChange={(e) => setTasbeehTarget(Number(e.target.value))}
                                className="text-center"
                                placeholder="الهدف"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
        <motion.div custom={8} initial="hidden" animate="visible" variants={cardVariants}>
             <Card className="bg-card/70 border-border/50 backdrop-blur-sm h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="text-primary" />
                        صندوق الإلهام
                    </CardTitle>
                    <CardDescription>
                       أفكارك السريعة ستظهر هنا. يمكنك إضافتها من صفحة الإلهامات.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col h-full items-center justify-center">
                   <div className="text-center">
                    <p className="text-muted-foreground">اذهب إلى صفحة الإلهامات لتدوين أفكارك.</p>
                     <Button asChild variant="link" className="mt-2">
                        <Link href="/dashboard/inspirations">
                             الذهاب إلى الإلهامات <ArrowLeft className="mr-2 h-4 w-4" />
                        </Link>
                    </Button>
                   </div>
                </CardContent>
            </Card>
        </motion.div>

       </div>

    </div>
  );
}

export default memo(DashboardPage);

    