'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AiAssistantPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الذكاء المساعد</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Sparkles className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">قيد الإنشاء</h3>
          <p className="text-muted-foreground max-w-md">
            هذا القسم سيكون مساعدك الذكي الذي يقترح عليك المهام ويحلل سلوكك ويقدم لك التحفيز. سيتم بناء هذه الميزة قريبًا!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
