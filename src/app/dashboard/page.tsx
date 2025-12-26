'use client';
import { useState, useMemo, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Task, Goal, Habit } from '@/lib/types';
import type { Challenge } from './challenges/page';
import { Loader2, ArrowLeft, RefreshCw, ExternalLink, Trophy, HandMetal } from 'lucide-react';
import { TimeWidget } from "@/components/dashboard/time-widget";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Particles } from '@/components/dashboard/Particles';

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
  { type: "آية", text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُsْعَهَا" },
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "صباح الخير، جاهز لتبدأ يومك؟";
  }
  if (hour < 18) {
    return "مساء الخير، كيف كان يومك حتى الآن؟";
  }
  return "مساء الخير، نتمنى لك أمسية هادئة.";
};


// Memoized components for performance
const MemoizedTimeWidget = memo(TimeWidget);
const MemoizedParticles = memo(Particles);

const WisdomCard = memo(({wisdom, onRefresh}: {wisdom: {type: string, text: string} | null, onRefresh: () => void}) => (
    <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="flex justify-between items-center text-primary">
                <span>{wisdom?.type} اليوم</span>
                 <Button variant="ghost" size="icon" onClick={onRefresh}><RefreshCw className="h-4 w-4"/></Button>
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-lg font-semibold text-center">"{wisdom?.text}"</p>
        </CardContent>
    </Card>
));
WisdomCard.displayName = 'WisdomCard';

const StatsCard = memo(({title, value, isLoading}: {title: string, value: number, isLoading: boolean}) => (
    <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : value}</div>
        </CardContent>
    </Card>
));
StatsCard.displayName = 'StatsCard';

const AchievementsCard = memo(({ challenges, isLoading }: { challenges: Challenge[] | null, isLoading: boolean }) => {
    const recentAchievements = useMemo(() => {
        if (!challenges) return [];
        return challenges
            .filter(c => c.achieved && c.achievedAt)
            .sort((a, b) => (b.achievedAt as Timestamp).toMillis() - (a.achievedAt as Timestamp).toMillis())
            .slice(0, 5);
    }, [challenges]);
    
    return (
        <Card className="h-full bg-card/50 backdrop-blur-sm flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Trophy className="text-primary"/> آخر الإنجازات</CardTitle>
                        <CardDescription>أحدث ما قمت بتحقيقه.</CardDescription>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/dashboard/challenges">
                             الكل <ArrowLeft className="mr-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                 {isLoading ? (
                    <div className="flex items-center justify-center h-full py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                 ) : recentAchievements && recentAchievements.length > 0 ? (
                    <div className="space-y-3">
                        {recentAchievements.map(achievement => (
                            <div key={achievement.id} className="p-2 bg-background/50 rounded-lg hover:bg-background transition-colors">
                                <h4 className="font-semibold truncate">{achievement.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {(achievement.achievedAt as Timestamp)?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-muted-foreground py-10">لا توجد إنجازات حديثة.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
});
AchievementsCard.displayName = 'AchievementsCard';


const DashboardPage = () => {
  const { user } = useUser();
  const firestore = useFirestore();

  const [currentWisdom, setCurrentWisdom] = useState<{type: string, text: string} | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setCurrentWisdom(getDailyWisdom());
    setGreeting(getGreeting());
  }, []);

  const tasksQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/tasks`), limit(50)) : null), [user, firestore]);
  const goalsQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/goals`)) : null), [user, firestore]);
  const habitsQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/habits`)) : null), [user, firestore]);
  const challengesQuery = useMemoFirebase(() => (user ? query(collection(firestore, `users/${user.uid}/challenges`)) : null), [user, firestore]);

  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksQuery);
  const { data: goals, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery);
  const { data: habits, isLoading: loadingHabits } = useCollection<Habit>(habitsQuery);
  const { data: challenges, isLoading: loadingChallenges } = useCollection<Challenge>(challengesQuery);

  const isLoading = loadingTasks || loadingGoals || loadingHabits || loadingChallenges;

  const stats = useMemo(() => ({
    tasksCompleted: tasks?.filter(t => t.status === 'completed').length || 0,
    activeGoals: goals?.filter(g => (g.progress || 0) < 100).length || 0,
    activeHabits: habits?.length || 0,
  }), [tasks, goals, habits]);
  
  const getNewWisdom = () => {
    setCurrentWisdom(getRandomWisdom());
  }

  return (
    <>
    <MemoizedParticles />
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0"
      >
        <div>
            <h2 className="text-3xl font-bold tracking-tight">{greeting}</h2>
            <p className="text-muted-foreground">نظرة عامة على عالمك الشخصي.</p>
        </div>
         <Button asChild size="lg">
            <Link href="https://aaamo68.youware.app/" target="_blank">
              <ExternalLink className="ml-2 h-5 w-5" />
              اكتب مذكرتك الآن
            </Link>
        </Button>
      </motion.div>
      
       <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
             <WisdomCard wisdom={currentWisdom} onRefresh={getNewWisdom} />
        </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <Card className="h-full bg-card/50 backdrop-blur-sm">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الوقت والتاريخ</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <MemoizedTimeWidget/>
                 </CardContent>
            </Card>
        </motion.div>
        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
            <StatsCard title="المهام المنجزة" value={stats.tasksCompleted} isLoading={isLoading} />
        </motion.div>
         <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
            <StatsCard title="الأهداف النشطة" value={stats.activeGoals} isLoading={isLoading} />
        </motion.div>
         <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}>
            <StatsCard title="العادات قيد التتبع" value={stats.activeHabits} isLoading={isLoading} />
        </motion.div>
      </div>

       <div className="grid gap-4 grid-cols-1">
        <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants}>
            <AchievementsCard challenges={challenges} isLoading={loadingChallenges} />
        </motion.div>
       </div>
    </div>
    </>
  );
}

export default DashboardPage;
