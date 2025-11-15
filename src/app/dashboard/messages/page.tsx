'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function MessagesPage() {
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSaveMessage = () => {
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لا يمكن حفظ رسالة فارغة.',
      });
      return;
    }
    // In a real implementation, you would save this message to Firestore
    // along with the future send date.
    toast({
      title: 'تم حفظ الرسالة',
      description: 'سيتم إرسال رسالتك لنفسك في المستقبل (ميزة قيد التطوير).',
    });
    setMessage('');
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
            اكتب حكمة، نصيحة، أو أمنية لنفسك المستقبلية. سيقوم النظام بتذكيرك بها لاحقًا.
            (ميزة تحديد تاريخ الإرسال قيد التطوير).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full gap-2">
             <Label htmlFor="message-to-self">رسالتك</Label>
            <Textarea
              id="message-to-self"
              placeholder="عزيزي أنا المستقبلي..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
            />
          </div>
          <Button onClick={handleSaveMessage}>
            <Send className="ml-2 h-4 w-4" />
            حفظ الرسالة للمستقبل
          </Button>
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
             <div className="flex flex-col items-center justify-center gap-4 p-8 text-center border-2 border-dashed rounded-lg">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">لا توجد رسائل بعد</h3>
                <p className="text-muted-foreground">
                    رسائلك المستقبلية ستظهر هنا عندما يحين وقتها.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
