'use client';
import { useState, useMemo, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Task, Goal, Habit, JournalEntry } from '@/lib/types';
import { Loader2, ArrowLeft, Lightbulb, RefreshCw, RotateCcw } from 'lucide-react';
import { TimeWidget } from "@/components/dashboard/time-widget";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  { type: "آية", text: "فَإِنَّ الذِّكْرَىٰ تَنفَعُ الْمُؤْمِنِينَ" },
  { type: "حديث", text: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ." },
  { type: "حكمة", text: "لا تؤجل عمل اليوم إلى الغد." },
  { type: "آية", text: "وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ" },
  { type: "حديث", text: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ." },
  { type: "حكمة", text: "الوقت كالسيف إن لم تقطعه قطعك." },
  { type: "آية", text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا" },
  { type: "حديث", text: "المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف." },
  { type: "حكمة", text: "من جد وجد ومن زرع حصد." },
];

const getDailyWisdom = () => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).valueOf()) / 1000 / 60 / 60 / 24);
    return wisdoms[dayOfYear % wisdoms.length];
};

const getRandomWisdom = () => {
    return wisdoms[Math.floor(Math.random() * wisdoms.length)];
};


const DashboardPage = () => {
  const { user } = useUser();
  const firestore = useFirestore();

  const [tasbeehCount, setTasbeehCount] = useState(0);
  const [currentTasbeeh, setCurrentTasbeeh] = useState(tasbeehOptions[0]);
  const [tasbeehTarget, setTasbeehTarget] = useState(33);
  const [currentWisdom, setCurrentWisdom] = useState<{type: string, text: string} | null>(null);

  useEffect(() => {
    setCurrentWisdom(getDailyWisdom());
  }, []);

  const tasksQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/tasks`), orderBy('updatedAt', 'desc'), limit(10)) : null), [user, firestore]);
  const goalsQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/goals`), orderBy('updatedAt', 'desc')) : null), [user, firestore]);
  const habitsQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/habits`)) : null), [user, firestore]);
  const journalQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/journalEntries`), orderBy('createdAt', 'desc'), limit(5)) : null), [user, firestore]);

  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksQuery);
  const { data: goals, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery);
  const { data: habits, isLoading: loadingHabits } = useCollection<Habit>(habitsQuery);
  const { data: journalEntries, isLoading: loadingJournal } = useCollection<JournalEntry>(journalQuery);

  const isLoading = loadingTasks || loadingGoals || loadingHabits || loadingJournal;

  const stats = useMemo(() => ({
    tasksCompleted: tasks?.filter(t => t.status === 'completed').length || 0,
    activeGoals: goals?.filter(g => (g.progress || 0) < 100).length || 0,
    activeHabits: habits?.length || 0,
  }), [tasks, goals, habits]);
  
  const handleTasbeehClick = () => {
    if (tasbeehCount + 1 >= tasbeehTarget) {
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        setTasbeehCount(tasbeehTarget);
    } else {
        setTasbeehCount(tasbeehCount + 1);
    }
  };

  const resetTasbeeh = () => {
    setTasbeehCount(0);
  }

  const getNewWisdom = () => {
    setCurrentWisdom(getRandomWisdom());
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
            <Card className="bg-card/70 border-primary/20 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center text-primary">
                        <span>{currentWisdom?.type} اليوم</span>
                         <Button variant="ghost" size="icon" onClick={getNewWisdom}><RefreshCw className="h-4 w-4"/></Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg font-semibold text-center">"{currentWisdom?.text}"</p>
                </CardContent>
            </Card>
        </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="h-full bg-card/70 border-border/50 backdrop-blur-sm">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الوقت والتاريخ</CardTitle>
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

       <div className="grid gap-4 grid-cols-1">
         <motion.div custom={5} initial="hidden" animate="visible" variants={cardVariants}>
             <Card className="h-full bg-card/70 border-border/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>آخر المذكرات</CardTitle>
                        <CardDescription>أحدث ما قمت بتدوينه.</CardDescription>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/dashboard/personal-box">
                             الكل <ArrowLeft className="mr-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                 {loadingJournal ? (
                    <div className="flex items-center justify-center h-full py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
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
                        <div className='grid grid-cols-2 gap-2'>
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
                             <div>
                                <label className="text-muted-foreground mb-2 block opacity-0">إعادة تعيين</label>
                                <Button onClick={resetTasbeeh} variant="outline" className="w-full">
                                    <RotateCcw className="ml-2 h-4 w-4" />
                                    إعادة تعيين
                                </Button>
                            </div>
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

    