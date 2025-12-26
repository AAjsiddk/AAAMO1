'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/lib/types';


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LogOut,
  Settings,
  Smile,
  Frown,
  Meh,
  Sparkles as ExcitedIcon,
  Annoyed,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';

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


export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isJournalDialogOpen, setIsJournalDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: { title: '', content: '' },
  });
  
  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/');
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '...';
    const names = name.split(' ');
    return names
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  const handleMoodSelect = (mood: NonNullable<JournalEntry['mood']>) => {
    const moodTitles = {
      happy: 'لحظة سعيدة',
      excited: 'شيء مثير!',
      neutral: 'يوم عادي',
      sad: 'أشعر بالحزن',
      anxious: 'قليل من القلق',
    };
    form.reset({ title: moodTitles[mood], content: '' });
    setIsJournalDialogOpen(true);
  };
  
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
        setIsJournalDialogOpen(false);
    } catch (error) {
        console.error("Error creating journal entry: ", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إنشاء التدوينة.' });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <>
     <Dialog open={isJournalDialogOpen} onOpenChange={setIsJournalDialogOpen}>
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
    
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/50 backdrop-blur-xl">
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <div className="mr-4 hidden md:flex">
            <Link href={user ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2">
              <Logo />
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {user && (
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  لوحة التحكم
                </Link>
              )}
            </nav>
          </div>
           {user && <SidebarTrigger />}

          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              {isUserLoading ? (
                <>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </>
              ) : user ? (
                <>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Smile className="h-5 w-5" />
                          <span className="sr-only">تغيير الحالة المزاجية</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>ما هي حالتك المزاجية اليوم؟</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleMoodSelect('happy')}>
                          <Smile className="ml-2 h-4 w-4 text-green-500" />
                          <span>سعيد</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoodSelect('excited')}>
                          <ExcitedIcon className="ml-2 h-4 w-4 text-yellow-500" />
                          <span>متحمس</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoodSelect('neutral')}>
                          <Meh className="ml-2 h-4 w-4 text-gray-500" />
                          <span>محايد</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoodSelect('sad')}>
                          <Frown className="ml-2 h-4 w-4 text-blue-500" />
                          <span>حزين</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoodSelect('anxious')}>
                          <Annoyed className="ml-2 h-4 w-4 text-purple-500" />
                          <span>قلق</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'مستخدم'} />
                          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                        <Settings className="ml-2 h-4 w-4" />
                        <span>الإعدادات</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="ml-2 h-4 w-4" />
                        <span>تسجيل الخروج</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/login">تسجيل الدخول</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">إنشاء حساب</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
