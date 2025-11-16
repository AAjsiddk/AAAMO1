'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import type { FutureMessage } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const messageSchema = z.object({
  message: z.string().min(1, { message: 'لا يمكن حفظ رسالة فارغة.' }),
});

export default function MessagesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' },
  });

  const messagesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/futureMessages`);
  }, [firestore, user]);

  const messagesQuery = useMemoFirebase(() => {
    if (!messagesCollectionRef) return null;
    return query(messagesCollectionRef, orderBy('createdAt', 'desc'));
  }, [messagesCollectionRef]);

  const { data: messages, isLoading } = useCollection<FutureMessage>(messagesQuery);

  const handleSaveMessage = async (values: z.infer<typeof messageSchema>) => {
    if (!messagesCollectionRef || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(messagesCollectionRef, {
        userId: user.uid,
        message: values.message,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'تم حفظ الرسالة',
        description: 'يمكنك رؤية رسالتك في الأرشيف بالأسفل.',
      });
      form.reset();
    } catch (error) {
      console.error("Error saving message:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ الرسالة.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!firestore || !user) return;
    const msgDocRef = doc(firestore, `users/${user.uid}/futureMessages`, messageId);
    try {
      await deleteDoc(msgDocRef);
      toast({ title: 'تم الحذف', description: 'تم حذف الرسالة بنجاح.' });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الرسالة.' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">رسائل لنفسي</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>اكتب رسالة إلى مستقبلك</CardTitle>
          <CardDescription>
            اكتب حكمة، نصيحة، أو أمنية لنفسك المستقبلية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSaveMessage)} className="space-y-4">
            <div className="grid w-full gap-2">
              <Label htmlFor="message-to-self">رسالتك</Label>
              <Textarea
                id="message-to-self"
                placeholder="عزيزي أنا المستقبلي..."
                {...form.register('message')}
                rows={8}
              />
              {form.formState.errors.message && <p className="text-sm font-medium text-destructive">{form.formState.errors.message.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
              حفظ الرسالة للمستقبل
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>أرشيف الرسائل</CardTitle>
          <CardDescription>
            هنا ستظهر الرسائل التي كتبتها لنفسك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {!isLoading && (!messages || messages.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center border-2 border-dashed rounded-lg">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">لا توجد رسائل بعد</h3>
              <p className="text-muted-foreground">
                رسائلك المستقبلية ستظهر هنا.
              </p>
            </div>
          ) : (
             <div className="space-y-4">
                {messages?.map(msg => (
                  <Card key={msg.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <p className="text-foreground whitespace-pre-wrap flex-1">{msg.message}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteMessage(msg.id)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {msg.createdAt ? `${formatDistanceToNow( (msg.createdAt as any).toDate(), { addSuffix: true, locale: ar })}` : 'الآن'}
                      </p>
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
