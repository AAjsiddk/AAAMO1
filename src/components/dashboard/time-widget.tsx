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
      setTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // Gregorian Date
      setGregorianDate(now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      // Hijri Date
      const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      setHijriDate(hijriFormatter.format(now));
    };
    
    updateDates();
    const intervalId = setInterval(updateDates, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">{time}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-lg text-muted-foreground">{gregorianDate}</p>
        <p className="text-lg text-primary">{hijriDate}</p>
      </CardContent>
    </Card>
  );
}
