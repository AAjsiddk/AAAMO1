'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, Sparkles, User, Bot, Plus, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { chatWithBot } from '@/ai/flows/chat-flow';

type Message = {
  role: 'user' | 'bot';
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

export default function AiAssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
           viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [activeConversation?.messages]);

  const startNewConversation = () => {
    const newId = `conv_${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: `محادثة جديدة ${conversations.length + 1}`,
      messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newId);
  };

  useEffect(() => {
    if (conversations.length === 0) {
      startNewConversation();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeConversationId) return;

    const userMessage: Message = { role: 'user', content: input };
    
    // Update the conversation with the user's message
    const updatedConversations = conversations.map(c => 
      c.id === activeConversationId 
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    );
    setConversations(updatedConversations);

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithBot({ query: currentInput });
      const botMessage: Message = { role: 'bot', content: response.answer };
      
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId 
          ? { ...c, messages: [...c.messages, botMessage] }
          : c
      ));

    } catch (error: any) {
      console.error("Error calling AI assistant:", error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الاتصال بالمساعد الذكي',
        description: error.message || 'فشل الاتصال بالنموذج. قد يكون مفتاح API غير صالح أو أن الخدمة غير متاحة.',
      });
      // Rollback user message on error
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId
          ? { ...c, messages: c.messages.slice(0, c.messages.length -1)}
          : c
      ));
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
     <div className="flex h-[calc(100vh_-_4rem)]">
      {/* Sidebar for conversations */}
      <div className="w-64 border-l bg-background/50 p-2 hidden md:flex flex-col">
        <Button onClick={startNewConversation} className="mb-2">
          <Plus className="ml-2 h-4 w-4" />
          محادثة جديدة
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {conversations.map(conv => (
              <Button
                key={conv.id}
                variant={activeConversationId === conv.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveConversationId(conv.id)}
              >
                <MessageSquare className="ml-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{conv.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        <div className="p-4 md:p-6 border-b">
           <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="text-primary" />
            <span>الذكاء المساعد</span>
          </h2>
          <CardDescription>محادثة مع Gemini. اطرح أي سؤال، أو اطلب المساعدة.</CardDescription>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {(!activeConversation || activeConversation.messages.length === 0) && (
                <div className="text-center text-muted-foreground pt-16">
                  <p>ابدأ محادثتك مع المساعد الذكي...</p>
                </div>
              )}
              {activeConversation?.messages.map((msg, index) => (
                <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'bot' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-lg rounded-lg p-3 text-sm",
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
        <div className="p-4 border-t bg-background">
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
            <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !activeConversationId}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
