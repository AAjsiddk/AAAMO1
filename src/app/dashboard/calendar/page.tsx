'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">التقويم المتكامل (الزمن الذكي)</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <CalendarIcon className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">التقويم المتكامل</h3>
          <p className="text-muted-foreground max-w-md">
            هذا القسم سيعرض جميع مهامك وأهدافك وعاداتك وأحداثك في تقويم واحد ذكي يجمع بين التاريخين الهجري والميلادي.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
