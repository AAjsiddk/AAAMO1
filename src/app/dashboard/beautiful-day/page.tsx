'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';

type BeautifulMoment = {
    id: string;
    content: string;
    createdAt: Timestamp;
}

export default function BeautifulDayPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const journalCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/journalEntries`);
  }, [user, firestore]);

  const entriesQuery = useMemoFirebase(() => {
    if (!journalCollectionRef) return null;
    return query(journalCollectionRef, orderBy('createdAt', 'desc'));
  }, [journalCollectionRef]);

  const { data: allEntries, isLoading } = useCollection<any>(entriesQuery);

  const beautifulMoments = useMemo(() => {
    if (!allEntries) return [];
    return allEntries
      .filter(entry => entry.title === 'My Beautiful Moment' || entry.title === 'لحظة سعيدة')
      .map(entry => {
        if (!entry.createdAt) return null; // Guard against null createdAt
        return {
          id: entry.id,
          content: entry.content,
          createdAt: entry.createdAt,
        } as BeautifulMoment;
      })
      .filter(Boolean) as BeautifulMoment[];
  }, [allEntries]);
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">يومي الجميل</h2>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>سجل اللحظات الإيجابية</CardTitle>
            <CardDescription>
                هذا القسم سيعرض اللحظات السعيدة التي تسجلها كل يوم لبناء عادة التفكير الإيجابي. 
                يمكنك إضافتها من خلال أيقونة "الحالة المزاجية" في الشريط العلوي.
            </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {!isLoading && beautifulMoments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">لم تسجل أي لحظات جميلة بعد</h3>
              <p className="text-muted-foreground max-w-md">
                استخدم زر الحالة المزاجية في الأعلى لتدوين أول لحظة إيجابية في يومك.
              </p>
            </div>
          ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {beautifulMoments.map(moment => (
                    <Card key={moment.id} className="bg-secondary/50 border-primary/20 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                             <p className="font-medium text-secondary-foreground">"{moment.content}"</p>
                             <p className="text-xs text-muted-foreground mt-2">{moment.createdAt?.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </CardContent>
                    </Card>
                 ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
