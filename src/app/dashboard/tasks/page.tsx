'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">المهام</h2>
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة مهمة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المهام</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            لا توجد مهام لعرضها بعد. ابدأ بإضافة مهمة جديدة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
