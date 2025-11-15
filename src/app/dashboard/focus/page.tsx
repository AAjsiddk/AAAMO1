'use client';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

export default function FocusPage() {
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES);
  const [minutes, setMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Timer finished
          if (audioRef.current) {
            audioRef.current.play();
          }
          setIsActive(false);
          setIsBreak(!isBreak);
          if (!isBreak) {
            setMinutes(breakMinutes);
          } else {
            setMinutes(focusMinutes);
          }
          setSeconds(0);
        }
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      if (interval) {
        clearInterval(interval);
      }
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, seconds, minutes, isBreak, breakMinutes, focusMinutes]);

  const toggle = () => {
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setIsBreak(false);
    setMinutes(focusMinutes);
    setSeconds(0);
  };
  
  const totalSeconds = isBreak ? breakMinutes * 60 : focusMinutes * 60;
  const remainingSeconds = minutes * 60 + seconds;
  const percentage = (remainingSeconds / totalSeconds) * 100;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">وضع الإنتاج العميق</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{isBreak ? 'وقت الراحة' : 'وقت التركيز'}</CardTitle>
          <CardDescription>
            استخدم تقنية البومودورو لتعزيز إنتاجيتك. ركز بحدة ثم خذ قسطًا من الراحة.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-8">
            <div className="w-64 h-64">
                <CircularProgressbar
                    value={percentage}
                    text={`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
                    styles={buildStyles({
                        textColor: 'hsl(var(--foreground))',
                        pathColor: `hsl(var(--primary))`,
                        trailColor: 'hsl(var(--muted))',
                        textSize: '20px',
                    })}
                />
            </div>

            <div className="flex items-center gap-4">
                <Button onClick={toggle} size="lg">
                    {isActive ? <Pause className="ml-2 h-5 w-5" /> : <Play className="ml-2 h-5 w-5" />}
                    {isActive ? 'إيقاف مؤقت' : 'بدء'}
                </Button>
                <Button onClick={reset} size="lg" variant="outline">
                    <RotateCcw className="ml-2 h-5 w-5" />
                    إعادة تعيين
                </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="space-y-2">
                    <Label htmlFor="focus-duration">مدة التركيز (دقائق)</Label>
                    <Input id="focus-duration" type="number" value={focusMinutes} onChange={(e) => setFocusMinutes(Number(e.target.value))} disabled={isActive} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="break-duration">مدة الراحة (دقائق)</Label>
                    <Input id="break-duration" type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} disabled={isActive} />
                </div>
            </div>
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />
        </CardContent>
      </Card>
    </div>
  );
}
