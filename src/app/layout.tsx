import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

const APP_URL = "https://i.postimg.cc/xdHyLQT2/file-0000000048b871f597ddf2ad56aeec8c.png";

export const metadata: Metadata = {
  title: 'عالمك الشخصي الذكي | لوحة تحكم متكاملة',
  description: 'منصة ذكية لتنظيم كل جوانب حياتك الشخصية بأمان وخصوصية.',
  openGraph: {
    title: 'عالمك الشخصي الذكي | لوحة تحكم متكاملة',
    description: 'منصة ذكية لتنظيم كل جوانب حياتك الشخصية بأمان وخصوصية.',
    url: APP_URL,
    images: [
      {
        url: APP_URL,
        width: 1200,
        height: 630,
        alt: 'Smart Personal World',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'عالمك الشخصي الذكي | لوحة تحكم متكاملة',
    description: 'منصة ذكية لتنظيم كل جوانب حياتك الشخصية بأمان وخصوصية.',
    images: [APP_URL],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@200;300;400;500;600;700&family=Cairo:wght@200;300;400;500;600;700;800;900;1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
