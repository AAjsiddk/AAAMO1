'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Droplets } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DynamicThemesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">نظام الثيمات الديناميكية</h2>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>مظهر يتكيف معك</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Droplets className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">قيد التطوير</h3>
          <p className="text-muted-foreground max-w-md">
            هذا القسم سيسمح للموقع بتغيير ألوانه تلقائيًا بناءً على حالتك النفسية المسجلة، وقت اليوم، أو حتى الطقس، لتجربة غامرة وفريدة. يمكنك تخصيص الألوان يدويًا من صفحة الإعدادات.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/settings">الانتقال إلى الإعدادات</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
