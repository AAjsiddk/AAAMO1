'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TimeWidget() {
  const [gregorianDate, setGregorianDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateDates = () => {
      const now = new Date();
      // Time
      setTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      // Gregorian Date
      setGregorianDate(now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      // Hijri Date
      const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });
      setHijriDate(hijriFormatter.format(now));
    };
    
    updateDates();
    const intervalId = setInterval(updateDates, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-3xl font-bold tracking-tighter">{time}</CardTitle>
      </CardHeader>
      <CardContent className="text-center flex flex-col items-center justify-center gap-1">
        <p className="text-sm text-muted-foreground">{gregorianDate}</p>
        <p className="text-sm font-medium text-primary">{hijriDate}</p>
      </CardContent>
    </Card>
  );
}
