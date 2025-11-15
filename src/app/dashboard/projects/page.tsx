'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, Inbox, PlusCircle } from 'lucide-react';

export default function ProjectsPage() {
  // This is a placeholder state. In a real app, you'd fetch this from Firestore.
  const projects: any[] = [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">المشاريع الطويلة</h2>
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" />
          مشروع جديد
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">لا توجد مشاريع بعد</h3>
            <p className="text-muted-foreground max-w-md">
              ابدأ بتخطيط مشروعك الكبير الأول. قسمه إلى مراحل ومهام لتحقيق أهدافك الطموحة.
            </p>
            <Button className="mt-4">
              <PlusCircle className="ml-2 h-4 w-4" />
              إنشاء مشروع جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* This is where project cards would be mapped and displayed */}
        </div>
      )}
    </div>
  );
}
