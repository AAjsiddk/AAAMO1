'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Languages,
  Lock,
  Palette,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero-abstract');

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
       <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mr-4">جاري التحميل...</p>
      </div>
    );
  }
  
  const features = [
    {
      icon: <Sparkles className="h-8 w-8 text-accent" />,
      title: 'مساعدة ذكية بالذكاء الاصطناعي',
      description:
        'دع الذكاء الاصطناعي يساعدك في تنظيم معلوماتك واقتراح الأفكار ذات الصلة.',
    },
    {
      icon: <Lock className="h-8 w-8 text-accent" />,
      title: 'أمان وخصوصية تامة',
      description:
        'بياناتك معزولة ومشفّرة بالكامل. أنت المتحكم الوحيد في عالمك الشخصي.',
    },
    {
      icon: <Palette className="h-8 w-8 text-accent" />,
      title: 'تخصيص كامل للواجهة',
      description:
        'اختر بين الوضع النهاري والليلي، وخصص الألوان لتناسب ذوقك الفريد.',
    },
    {
      icon: <Languages className="h-8 w-8 text-accent" />,
      title: 'دعم كامل للغة العربية',
      description:
        'واجهة مصممة من اليمين إلى اليسار لتجربة استخدام سلسة وطبيعية.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background/50 py-20 md:py-32">
          <div
            aria-hidden="true"
            className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20 dark:opacity-20"
          >
            <div className="h-56 bg-gradient-to-br from-primary to-purple-400 blur-[106px] dark:from-blue-700"></div>
            <div className="h-32 bg-gradient-to-r from-cyan-400 to-sky-300 blur-[106px] dark:to-indigo-600"></div>
          </div>
          <div className="container relative text-center">
            <div className="mx-auto max-w-3xl">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                عالمك الشخصي الذكي.
                <br />
                <span className="text-primary">منظم. آمن. لك وحدك.</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                نقدم لك منصة ثورية لإدارة كل جوانب حياتك الشخصية بذكاء وأمان. من الملاحظات والأفكار إلى المشاريع والذكريات، كل شيء في مكان واحد.
              </p>
              <div
                id="start"
                className="mt-10 flex items-center justify-center gap-x-6"
              >
                <Button asChild size="lg">
                  <Link href="/register">
                    ابدأ رحلتك الآن
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/#features">
                    اكتشف المزيد
                  </Link>
                </Button>
              </div>
            </div>
            {heroImage && (
              <div className="mt-16 flow-root sm:mt-24">
                <div className="-m-2 rounded-xl bg-card/50 p-2 ring-1 ring-inset ring-foreground/5 lg:-m-4 lg:rounded-2xl lg:p-4">
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={1200}
                    height={800}
                    data-ai-hint={heroImage.imageHint}
                    className="rounded-md shadow-2xl ring-1 ring-foreground/10"
                    priority
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-background py-24 sm:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                كل ما تحتاجه لإدارة عالمك
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                أدوات قوية وميزات ذكية مصممة لتبسيط حياتك وتعزيز إنتاجيتك.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="transform-gpu bg-card/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl dark:bg-secondary"
                >
                  <CardHeader className="flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-background/50 py-24 sm:py-32">
          <div className="container text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              هل أنت مستعد لبناء عالمك الذكي؟
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              انضم إلينا اليوم واكتشف قوة التنظيم والخصوصية.
            </p>
            <div className="mt-10">
              <Button asChild size="lg">
                <Link href="/register">
                  إنشاء حساب مجاني
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} عالمي الشخصي الذكي. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
