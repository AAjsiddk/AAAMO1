'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function FocusPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">وضع الإنتاج العميق</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Clock className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">عزز تركيزك وإنتاجيتك</h3>
          <p className="text-muted-foreground max-w-md">
            هذا القسم سيساعدك على التركيز عن طريق قفل الإشعارات وبدء عداد للتركيز بتقنية البومودورو، مع أصوات مهدئة لمساعدتك على الدخول في حالة من التدفق.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
