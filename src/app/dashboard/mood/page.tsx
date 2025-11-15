'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Smile } from 'lucide-react';

export default function MoodPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">مرآة الذات اليومية</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Smile className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">تتبع حالتك المزاجية</h3>
          <p className="text-muted-foreground max-w-md">
            هذا القسم سيسمح لك بتقييم حالتك المزاجية كل يوم وربطها بإنجازاتك. ستتمكن من رؤية رسوم بيانية توضح تطور حالتك بمرور الوقت.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
