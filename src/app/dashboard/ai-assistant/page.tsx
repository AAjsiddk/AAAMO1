'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, Sparkles, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
// Note: In a real app, you would have a Genkit flow for this.
// We are simulating the call here.
// import { chatWithBot } from '@/ai/flows/chat-flow';

type Message = {
  role: 'user' | 'bot';
  content: string;
};

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hacky way to get the viewport element, but it works.
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
           viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // ** SIMULATED GENKIT CALL **
      // In a real app, you would call your Genkit flow:
      // const response = await chatWithBot({ query: input });
      // const botMessageContent = response.answer;
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      const botMessageContent = `هذا رد تمت محاكاته من مساعد الذكاء الاصطناعي. في تطبيق حقيقي، سيتم ربط هذا مع Gemini. لقد سألت عن: "${userMessage.content}"`;

      const botMessage: Message = { role: 'bot', content: botMessageContent };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Error calling AI assistant:", error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء التواصل مع المساعد الذكي.',
      });
      // Optionally remove the user's message if the call fails
      setMessages(prev => prev.slice(0, prev.length -1));

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight">الذكاء المساعد</h2>
      </div>

      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            <span>محادثة مع Gemini</span>
          </CardTitle>
          <CardDescription>اطرح أي سؤال، أو اطلب المساعدة في تنظيم أفكارك.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">
                  <p>ابدأ محادثتك مع المساعد الذكي...</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'bot' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-sm rounded-lg p-3",
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                   {msg.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Textarea
                placeholder="اكتب رسالتك هنا..."
                className="flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
