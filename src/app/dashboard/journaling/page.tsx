'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookText, ExternalLink, Lightbulb } from 'lucide-react';
import Link from 'next/link';

const dailyTips = [
  "اكتب عن ثلاثة أشياء تشعر بالامتنان تجاهها اليوم.",
  "صف تحديًا واجهته وكيف تغلبت عليه.",
  "ما هو الشيء الجديد الذي تعلمته اليوم؟",
  "اكتب رسالة إلى نفسك في المستقبل.",
  "ما هو الهدف الذي تعمل على تحقيقه الآن؟",
  "صف شعورك بالتفصيل في هذه اللحظة.",
  "من هو الشخص الذي أثر فيك بشكل إيجابي اليوم؟",
  "اكتب عن حلم أو طموح كبير لديك.",
  "ما هي العادة التي تود بناءها أو التخلص منها؟",
  "صف مكانًا يجعلك تشعر بالسلام والراحة."
];


export default function JournalingPage() {
  const [tip, setTip] = useState('');

  useEffect(() => {
    // Select a random tip on component mount
    setTip(dailyTips[Math.floor(Math.random() * dailyTips.length)]);
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookText className="h-8 w-8" />
          المذكرة الخارجية
        </h2>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>مساحتك الخاصة للكتابة</CardTitle>
            <CardDescription>
                هذا القسم مخصص لربط مذكراتك الخارجية. يمكنك الوصول إليها بسهولة من هنا.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            <p className="text-lg font-semibold">
                افتح مذكرتك الخارجية للبدء في تدوين أفكارك ومشاعرك.
            </p>
            <Button asChild size="lg">
                <Link href="https://aaamo68.youware.app/" target="_blank">
                    <ExternalLink className="ml-2 h-5 w-5" />
                    افتح المذكرة
                </Link>
            </Button>
        </CardContent>
      </Card>
      
      <Card className="mt-6 bg-primary/10 border-primary/20">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
                <Lightbulb className="h-6 w-6" />
                فكرة للكتابة اليوم
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-lg text-center font-medium">"{tip}"</p>
        </CardContent>
      </Card>
    </div>
  );
}
