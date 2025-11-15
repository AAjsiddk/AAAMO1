'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FolderKanban, Inbox, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function ProjectsPage() {
  // This is a placeholder state. In a real app, you'd fetch this from Firestore.
  const projects: any[] = [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    // Placeholder for actual logic
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsDialogOpen(false);
    toast({
        title: "تم إنشاء المشروع (محاكاة)",
        description: "سيتم حفظ المشروع في قاعدة البيانات في التحديثات القادمة."
    })

  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">المشاريع الطويلة</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="ml-2 h-4 w-4" />
              مشروع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>إنشاء مشروع جديد</DialogTitle>
            </DialogHeader>
             <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="project-name">اسم المشروع</Label>
                    <Input id="project-name" placeholder="مثال: إطلاق المنتج الجديد" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="project-description">وصف المشروع</Label>
                    <Textarea id="project-description" placeholder="صف أهداف المشروع ومراحله الرئيسية" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">إلغاء</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    إنشاء المشروع
                  </Button>
                </DialogFooter>
             </form>
          </DialogContent>
        </Dialog>
      </div>


      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">لا توجد مشاريع بعد</h3>
            <p className="text-muted-foreground max-w-md">
              ابدأ بتخطيط مشروعك الكبير الأول. قسمه إلى مراحل ومهام لتحقيق أهدافك الطموحة.
            </p>
             <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
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
