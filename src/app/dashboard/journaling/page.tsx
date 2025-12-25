'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookText, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function ExternalJournalPage() {
  const externalJournalUrl = 'https://aaamo68.youware.app/';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">المذكرة الخارجية</h2>
      </div>
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <BookText className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="pt-4">مذكراتك في مكان واحد</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            لقد قمنا بربط قسم المذكرات بموقع خارجي متخصص لتوفير أفضل تجربة تدوين ممكنة لك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            انقر على الزر أدناه للتوجه إلى مذكراتك.
          </p>
          <Button asChild size="lg">
            <Link href={externalJournalUrl} target="_blank" rel="noopener noreferrer">
              افتح المذكرة
              <ArrowUpRight className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
