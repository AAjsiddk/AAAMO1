'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, RotateCcw, Star, Award, Trophy, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

const challenges = [
  {
    id: 'starter',
    title: 'المبادر',
    description: 'أكملت مهمتك الأولى بنجاح.',
    icon: Star,
    color: 'text-yellow-400',
  },
  {
    id: 'weekly-organizer',
    title: 'المنظم الأسبوعي',
    description: 'أضفت 5 مهام في أسبوع واحد.',
    icon: Award,
    color: 'text-blue-400',
  },
  {
    id: 'focus-master',
    title: 'سيد التركيز',
    description: 'استخدمت وضع التركيز لمدة ساعة كاملة.',
    icon: Zap,
    color: 'text-purple-400',
  },
  {
    id: 'habit-maker',
    title: 'صانع العادات',
    description: 'حافظت على سلسلة التزام لمدة 7 أيام متتالية.',
    icon: Trophy,
    color: 'text-green-400',
  },
];

const ConfettiPiece = ({ x, y, rotation, color }: { x: number; y: number; rotation: number, color: string }) => (
  <motion.div
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      backgroundColor: color,
      width: '8px',
      height: '16px',
      rotate: rotation,
      borderRadius: '2px',
    }}
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
    exit={{ opacity: 0, y: 20, transition: { duration: 0.5 } }}
  />
);

const ConfettiBackground = () => {
    const colors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'];
    const confetti = React.useMemo(() => 
        Array.from({ length: 100 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            rotation: Math.random() * 360,
            color: colors[Math.floor(Math.random() * colors.length)]
        })), [colors]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {confetti.map(c => (
                <ConfettiPiece key={c.id} x={c.x} y={c.y} rotation={c.rotation} color={c.color} />
            ))}
        </div>
    )
}

export default function ChallengesPage() {
  const [completed, setCompleted] = React.useState<string[]>(['starter']);

  const handleToggle = (id: string) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gray-900 text-white relative overflow-hidden min-h-screen">
      <AnimatePresence>
        {completed.length > 0 && <ConfettiBackground />}
      </AnimatePresence>
      <div className="relative z-10">
        <div className="flex items-center justify-between space-y-2 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">الإنجازات والتحديات</h2>
        </div>
        <p className="text-muted-foreground mb-8">احتفل بإنجازاتك وتحدياتك التي أكملتها.</p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge, index) => {
            const isCompleted = completed.includes(challenge.id);
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 text-white flex flex-col h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{challenge.title}</CardTitle>
                        <div className={`p-3 rounded-full bg-gray-700 ${challenge.color}`}>
                             <challenge.icon className="h-6 w-6"/>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{challenge.description}</p>
                  </CardContent>
                   <div className="p-4 pt-0">
                     <Button 
                        className={`w-full font-bold transition-all duration-300 ${isCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'}`}
                        onClick={() => handleToggle(challenge.id)}
                    >
                        {isCompleted ? (
                             <> <RotateCcw className="ml-2 h-4 w-4" /> تراجع </>
                        ) : (
                             <> <Check className="ml-2 h-4 w-4" /> إكمال التحدي </>
                        )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
