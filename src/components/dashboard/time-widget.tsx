'use client';
import { useEffect, useState, memo } from 'react';

// Using React.memo to prevent re-renders when parent components update
const TimeWidgetInternal = () => {
  const [time, setTime] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');

  useEffect(() => {
    const updateDates = () => {
      const now = new Date();
      // Time
      setTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }));
      // Gregorian Date
      setGregorianDate(now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      // Hijri Date
      setHijriDate(new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day: 'numeric', month: 'long', year: 'numeric'}).format(now));
    };
    
    updateDates();
    const intervalId = setInterval(updateDates, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="text-5xl font-bold tracking-tight">{time}</div>
        <p className="mt-2 text-lg text-muted-foreground">{gregorianDate}</p>
        <p className="text-md text-muted-foreground/80">{hijriDate}</p>
    </div>
  );
};

export const TimeWidget = memo(TimeWidgetInternal);
TimeWidget.displayName = 'TimeWidget';
