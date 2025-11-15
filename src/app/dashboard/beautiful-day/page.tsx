'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function BeautifulDayPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">يومي الجميل</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Sparkles className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">لحظة إيجابية كل يوم</h3>
          <p className="text-muted-foreground max-w-md">
            هذا القسم سيمكنك من تسجيل لحظة إيجابية واحدة كل يوم لبناء عادة التفكير الإيجابي. سيتم عرض هذه اللحظات في لوحة الامتنان الخاصة بك.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
