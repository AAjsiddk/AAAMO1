'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

const TiptapEditor = React.lazy(() => import('@/components/editor/TiptapEditor'));

export default function JournalingPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (user && firestore) {
      const journalDocRef = doc(firestore, `users/${user.uid}/journaling`, 'main');
      getDoc(journalDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            setContent(docSnap.data().content);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
        setIsLoading(false);
    }
  }, [user, firestore]);

  const handleSave = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول لحفظ المذكرة.' });
      return;
    }
    setIsSaving(true);
    try {
      const journalDocRef = doc(firestore, `users/${user.uid}/journaling`, 'main');
      await setDoc(journalDocRef, {
        content: content,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: 'تم الحفظ', description: 'تم حفظ مذكرتك بنجاح.' });
    } catch (error) {
      console.error('Error saving journal:', error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ المذكرة.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">المذكرة</h2>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                حفظ
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>مساحة للكتابة الحرة</CardTitle>
                <CardDescription>
                    هنا يمكنك تدوين أفكارك، وخواطرك، وتأملاتك. هذه هي صفحتك البيضاء.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading || !isClient ? (
                    <div className="flex justify-center items-center h-96">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <React.Suspense fallback={<div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                         <TiptapEditor
                            content={content}
                            onChange={(newContent) => setContent(newContent)}
                        />
                    </React.Suspense>
                )}
            </CardContent>
        </Card>
    </div>
  )
}
