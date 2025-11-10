'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  displayName: z.string().min(1, { message: 'الرجاء إدخال اسمك.' }),
  email: z.string().email({ message: 'الرجاء إدخال بريد إلكتروني صالح.' }),
  password: z
    .string()
    .min(6, { message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' }),
});

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });

  const saveUserToFirestore = async (user: FirebaseUser, displayName: string, email: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    await setDoc(userDocRef, {
      id: user.uid,
      displayName: displayName,
      email: email,
      createdAt: serverTimestamp(),
      theme: 'light',
      primaryColor: '231 48% 54%',
      backgroundColor: '234 43% 94%',
      accentColor: '261 35% 58%',
    }, { merge: true });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'خدمة المصادقة غير متاحة حالياً.',
      });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const newUser = userCredential.user;

      // 2. Update user's profile in Firebase Auth
      await updateProfile(newUser, { displayName: values.displayName });

      // 3. Save user data to Firestore
      await saveUserToFirestore(newUser, values.displayName, values.email);

      toast({
        title: 'تم إنشاء الحساب بنجاح!',
        description: 'أهلاً بك في عالمك الشخصي الذكي. سيتم توجيهك الآن...',
      });
      // The onAuthStateChanged listener in FirebaseProvider will handle the redirect.
    } catch (error: any) {
      console.error("Registration Error:", error);
      const errorCode = error.code;
      let description = 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.';
      if (errorCode === 'auth/email-already-in-use') {
        description = 'هذا البريد الإلكتروني مسجل بالفعل.';
      } else if (errorCode === 'auth/weak-password') {
        description = 'كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل.';
      } else if (errorCode === 'auth/invalid-email') {
        description = 'البريد الإلكتروني الذي أدخلته غير صالح.';
      }
      toast({
        variant: 'destructive',
        title: 'فشل إنشاء الحساب',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold">إنشاء حساب جديد</h1>
        <p className="mb-6 text-center text-muted-foreground">
          انضم إلينا وابدأ في تنظيم عالمك.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl>
                    <Input placeholder="اسمك الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            سجل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
