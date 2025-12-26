'use client';
import { useEffect, useState, memo } from 'react';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const TimeWidgetInternal = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const updateDates = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDate(now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      try {
        setHijriDate(new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day: 'numeric', month: 'long', year: 'numeric'}).format(now));
      } catch (e) {
        // Fallback for browsers that don't support islamic calendar
        console.error("Hijri calendar not supported", e);
        setHijriDate("التقويم الهجري غير مدعوم");
      }
      setSeconds(now.getSeconds());
    };
    
    updateDates();
    const intervalId = setInterval(updateDates, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const percentage = (seconds / 60) * 100;

  return (
     <div className="flex flex-col items-center justify-center text-center h-full">
        <div style={{ width: 120, height: 120 }}>
          <CircularProgressbarWithChildren
            value={percentage}
            strokeWidth={3}
            styles={buildStyles({
              pathColor: `hsl(var(--primary))`,
              trailColor: 'hsl(var(--muted))',
              pathTransitionDuration: 0.1,
            })}
          >
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold tracking-tight text-foreground">{time.split(' ')[0]}</div>
              <div className="text-sm text-muted-foreground">{time.split(' ')[1]}</div>
            </div>
          </CircularProgressbarWithChildren>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{date}</p>
        <p className="text-xs text-muted-foreground/80">{hijriDate}</p>
    </div>
  );
};

export const TimeWidget = memo(TimeWidgetInternal);
TimeWidget.displayName = 'TimeWidget';
