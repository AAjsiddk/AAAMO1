'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HandMetal, Plus, RotateCcw } from 'lucide-react';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const defaultAthkar = [
  'سبحان الله',
  'الحمد لله',
  'لا إله إلا الله',
  'الله أكبر',
  'سبحان الله وبحمده',
  'سبحان الله العظيم',
  'لا حول ولا قوة إلا بالله',
  'أستغفر الله',
  'اللهم صل على محمد',
];

export default function TasbeehPage() {
  const [selectedDhikr, setSelectedDhikr] = useState(defaultAthkar[0]);
  const [customDhikr, setCustomDhikr] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [target, setTarget] = useState(100);
  const [count, setCount] = useState(0);

  const currentDhikr = isCustom ? customDhikr : selectedDhikr;
  const percentage = (count / target) * 100;
  
  const handleDhikrChange = (value: string) => {
    if (value === 'other') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setSelectedDhikr(value);
    }
  };

  const increment = () => {
    if (count < target) {
      setCount(count + 1);
    }
  };
  
  const reset = () => {
    setCount(0);
  };
  
  useEffect(() => {
    reset();
  }, [target, currentDhikr]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HandMetal className="h-8 w-8 text-primary"/>
            السبحة الإلكترونية
        </h2>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle className="text-center text-2xl">
                التسبيح الحالي: {currentDhikr || "اختر ذكرًا"}
            </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-8">
            <div className="w-60 h-60">
                 <CircularProgressbarWithChildren
                    value={percentage}
                    strokeWidth={6}
                    styles={buildStyles({
                        pathColor: `hsl(var(--primary))`,
                        trailColor: 'hsl(var(--muted))',
                        pathTransitionDuration: 0.2,
                    })}
                 >
                    <div className="text-6xl font-bold font-mono tracking-tighter">
                        {count}
                    </div>
                 </CircularProgressbarWithChildren>
            </div>

            <div className="w-full space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium">اختر نوع التسبيح</label>
                        <Select onValueChange={handleDhikrChange} defaultValue={selectedDhikr} dir="rtl">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {defaultAthkar.map(dhikr => (
                                    <SelectItem key={dhikr} value={dhikr}>{dhikr}</SelectItem>
                                ))}
                                <SelectItem value="other">ذكر آخر...</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">الهدف</label>
                        <Input type="number" value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))} placeholder="العدد المستهدف" />
                     </div>
                 </div>

                 {isCustom && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">اكتب الذكر المخصص</label>
                        <Input value={customDhikr} onChange={(e) => setCustomDhikr(e.target.value)} placeholder="مثال: الحمد لله رب العالمين" />
                    </div>
                 )}

                 <p className="text-center text-muted-foreground">التقدم: {count} / {target}</p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="flex-1 text-lg" onClick={increment}>
                        <Plus className="ml-2 h-5 w-5"/> سبّح
                    </Button>
                    <Button size="lg" variant="outline" className="flex-1 text-lg" onClick={reset}>
                        <RotateCcw className="ml-2 h-5 w-5"/> إعادة الضبط
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
