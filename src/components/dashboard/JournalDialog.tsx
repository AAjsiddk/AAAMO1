'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const journalSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب.' }),
  content: z.string().min(1, { message: 'المحتوى مطلوب.' }),
});

const analyzeMood = (text: string): JournalEntry['mood'] => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('سعيد') || lowerText.includes('متحمس') || lowerText.includes('رائع')) return 'happy';
    if (lowerText.includes('حزين') || lowerText.includes('محبط') || lowerText.includes('سيء')) return 'sad';
    if (lowerText.includes('قلق') || lowerText.includes('متوتر')) return 'anxious';
    if (lowerText.includes('مثير') || lowerText.includes('مدهش')) return 'excited';
    return 'neutral';
};

export function JournalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: { title: '', content: '' },
  });

  const onJournalSubmit = async (values: z.infer<typeof journalSchema>) => {
    if (!firestore || !user) return;
    const journalCollectionRef = collection(firestore, `users/${user.uid}/journalEntries`);
    setIsSubmitting(true);
    
    try {
        const mood = analyzeMood(values.content);

        const newEntry: Omit<JournalEntry, 'id'> = {
          title: values.title,
          content: values.content,
          userId: user.uid,
          mood: mood,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(journalCollectionRef, newEntry);
        
        toast({ title: 'نجاح', description: 'تمت إضافة تدوينتك بنجاح.' });
        form.reset();
        onOpenChange(false);
    } catch (error) {
        console.error("Error creating journal entry: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إنشاء التدوينة.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>تدوينة جديدة</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onJournalSubmit)} className="space-y-4">
            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="يوم مميز..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="content" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>المحتوى</FormLabel><FormControl><Textarea placeholder="ماذا يدور في خلدك؟" {...field} rows={6} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
