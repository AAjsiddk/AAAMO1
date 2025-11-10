'use client';
import { useUser } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FilePlus,
  Target,
  Book,
  ClipboardCheck,
  Repeat,
} from 'lucide-react';
import { TimeWidget } from '@/components/dashboard/time-widget';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const dailyProgress = 66; // Placeholder value

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          أهلاً بعودتك، {user?.displayName || 'مستخدم'}!
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TimeWidget />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              مؤشر الإنجاز اليومي
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="mx-auto w-32 h-32">
                <CircularProgressbar
                  value={dailyProgress}
                  text={`${dailyProgress}%`}
                  styles={buildStyles({
                    textColor: 'hsl(var(--foreground))',
                    pathColor: 'hsl(var(--primary))',
                    trailColor: 'hsl(var(--muted))',
                    textSize: '16px',
                  })}
                />
              </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>إضافة سريعة</CardTitle>
            <CardDescription>
              ابدأ في تنظيم عالمك بخطوة واحدة.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button variant="outline" className="flex flex-col h-24">
              <Target className="h-8 w-8 mb-2 text-primary" />
              <span>هدف</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24">
              <Repeat className="h-8 w-8 mb-2 text-primary" />
              <span>عادة</span>
            </Button>
            <Button asChild variant="outline" className="flex flex-col h-24">
              <Link href="/dashboard/tasks">
                <ClipboardCheck className="h-8 w-8 mb-2 text-primary" />
                <span>مهمة</span>
              </Link>
            </Button>
            <Button variant="outline" className="flex flex-col h-24">
              <Book className="h-8 w-8 mb-2 text-primary" />
              <span>ملاحظة</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24">
              <FilePlus className="h-8 w-8 mb-2 text-primary" />
              <span>ملف</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>آخر المذكرات</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
                <p className="text-center text-muted-foreground py-8">لا توجد مذكرات لعرضها بعد.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>تذكير اليوم</CardTitle>
             <CardDescription>
              رسالتك اليومية للتحفيز والإلهام.
            </CardDescription>
          </Header>
          <CardContent>
             <p className="text-center text-muted-foreground py-8">"لا تؤجل عمل اليوم إلى الغد."</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
