'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { BookText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function JournalingPage() {
  const [content, setContent] = useState<string>('<p>ابدأ الكتابة هنا...</p>');
  const { toast } = useToast();

  const handleSave = () => {
    // In a real app, you would save the `content` (which is HTML) to your database.
    console.log('Saving content:', content);
    toast({
      title: 'تم الحفظ (محاكاة)',
      description: 'تم حفظ محتوى المذكرة بنجاح.',
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookText className="h-8 w-8" />
          المذكرة
        </h2>
        <Button onClick={handleSave}>
            <Save className="ml-2 h-4 w-4" />
            حفظ
        </Button>
      </div>
      <Card>
        <CardContent className="p-4 md:p-6">
          <TiptapEditor content={content} onChange={setContent} />
        </CardContent>
      </Card>
    </div>
  );
}
