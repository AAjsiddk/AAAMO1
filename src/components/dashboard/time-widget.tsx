'use client';
import { useEffect, useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Using React.memo to prevent re-renders when parent components update
const TimeWidgetInternal = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateDates = () => {
      const now = new Date();
      // Time
      setTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    
    updateDates();
    const intervalId = setInterval(updateDates, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="text-5xl font-bold tracking-tight">{time}</div>
  );
};

export const TimeWidget = memo(TimeWidgetInternal);
TimeWidget.displayName = 'TimeWidget';
