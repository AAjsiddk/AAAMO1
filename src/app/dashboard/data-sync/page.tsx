'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function DataSyncPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">تصدير واستيراد البيانات</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">قيد الإنشاء</h3>
          <p className="text-muted-foreground max-w-md">
            هذا القسم سيتيح لك تحميل بياناتك بالكامل أو استعادتها لضمان عدم فقدانها. سيتم بناء هذه الميزة قريبًا!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
