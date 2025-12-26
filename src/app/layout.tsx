import type { Metadata } from 'next';
import { Cairo, Readex_Pro } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

const APP_URL = "https://i.postimg.cc/SsCZHxTH/sh-ar-asfr-ahmr-warjwany-hdyth-akadymyt-alt-lym-1.png";

export const metadata: Metadata = {
  title: 'عالمك الشخصي الذكي | لوحة تحكم متكاملة',
  description: 'منصة ذكية لتنظيم كل جوانب حياتك الشخصية بأمان وخصوصية.',
  openGraph: {
    title: 'عالمك الشخصي الذكي | لوحة تحكم متكاملة',
    description: 'منصة ذكية لتنظيم كل جوانب حياتك الشخصية بأمان وخصوصية.',
    url: "https://studio.chml.io",
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

const fontCairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const fontReadex = Readex_Pro({
  subsets: ['arabic', 'latin'],
  variable: '--font-readex-pro',
  display: 'swap',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme) {
                    document.documentElement.className = theme;
                  } else {
                    // If no theme is stored, default to dark
                    document.documentElement.className = 'dark';
                  }
                } catch (e) {
                  // Fallback for environments where localStorage is not available
                  document.documentElement.className = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={cn('min-h-screen font-body antialiased', fontCairo.variable, fontReadex.variable)}>
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
