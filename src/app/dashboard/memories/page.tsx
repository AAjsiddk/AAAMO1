'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MemoriesPage() {
  const telegramLink = "https://t.me/+AT47CBH83uQzOTU0";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الذكريات</h2>
      </div>
       <Card>
           <CardHeader>
               <CardTitle>أرشيف الذكريات</CardTitle>
               <CardDescription>
                   الوصول السريع إلى أرشيف الذكريات الخارجية الخاصة بك.
               </CardDescription>
           </CardHeader>
           <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Camera className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">ذكرياتك في مكان واحد</h3>
              <p className="text-muted-foreground max-w-md">
                انقر على الزر أدناه لفتح أرشيف الذكريات الخاص بك على تليجرام.
              </p>
              <Button asChild className="mt-4" size="lg">
                <Link href={telegramLink} target="_blank">افتح الذكريات</Link>
              </Button>
           </CardContent>
         </Card>
    </div>
  );
}
