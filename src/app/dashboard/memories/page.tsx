'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { format, isSameDay, subYears, addYears } from 'date-fns';
import { ar } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Memory = {
    id: string;
    title: string;
    imageUrls: string[];
    createdAt: Timestamp;
}

export default function MemoriesPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const journalQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/journalEntries`), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: journalEntries, isLoading } = useCollection<any>(journalQuery);

    const memories = useMemo<Memory[]>(() => {
        if (!journalEntries) return [];
        return journalEntries
            .filter(entry => entry.imageUrls && entry.imageUrls.length > 0 && entry.createdAt)
            .map(entry => ({
                id: entry.id,
                title: entry.title,
                imageUrls: entry.imageUrls,
                createdAt: entry.createdAt,
            }));
    }, [journalEntries]);

    const onThisDayMemories = useMemo(() => {
        const today = new Date();
        return memories.filter(memory => {
            const memoryDate = memory.createdAt.toDate();
            return memoryDate.getDate() === today.getDate() &&
                   memoryDate.getMonth() === today.getMonth() &&
                   memoryDate.getFullYear() !== today.getFullYear();
        });
    }, [memories]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الذكريات</h2>
      </div>

       {isLoading && (
         <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      )}

      {!isLoading && memories.length === 0 && (
         <Card>
           <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Camera className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">لا توجد ذكريات مصورة بعد</h3>
              <p className="text-muted-foreground max-w-md">
                أضف تدوينات في "المذكرات" مع صور لبدء بناء أرشيف ذكرياتك.
              </p>
              <Button asChild className="mt-2">
                <Link href="/dashboard/journal">اذهب إلى المذكرات</Link>
              </Button>
           </CardContent>
         </Card>
      )}

      {!isLoading && onThisDayMemories.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>في مثل هذا اليوم</CardTitle>
                <CardDescription>ذكرياتك من السنوات الماضية في نفس هذا اليوم.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Carousel className="w-full max-w-4xl mx-auto" opts={{ direction: 'rtl' }}>
                  <CarouselContent>
                    {onThisDayMemories.map((memory) => (
                      <CarouselItem key={memory.id}>
                        <div className="p-1">
                          <Card>
                            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                               <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                                 <Image src={memory.imageUrls[0]} alt={memory.title} layout="fill" objectFit="cover" />
                               </div>
                               <div className="text-center">
                                    <h4 className="font-semibold">{memory.title}</h4>
                                    <p className="text-sm text-muted-foreground">{format(memory.createdAt.toDate(), "d MMMM yyyy", {locale: ar})}</p>
                               </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
            </CardContent>
        </Card>
      )}
      
       {!isLoading && memories.length > 0 && (
         <Card className="mt-4">
            <CardHeader>
                <CardTitle>كل الذكريات</CardTitle>
                 <CardDescription>تصفح جميع لحظاتك المصورة.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {memories.map(memory => (
                     <div key={memory.id} className="group relative aspect-square overflow-hidden rounded-lg">
                         <Image src={memory.imageUrls[0]} alt={memory.title} layout="fill" objectFit="cover" className="transition-transform group-hover:scale-105" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                         <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4 className="font-semibold text-white truncate">{memory.title}</h4>
                            <p className="text-xs text-white/80">{format(memory.createdAt.toDate(), "d MMM yyyy", {locale: ar})}</p>
                         </div>
                     </div>
                 ))}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
