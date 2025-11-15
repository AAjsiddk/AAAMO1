'use client';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FolderKanban, Inbox, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Goal as Project } from '@/lib/types'; // Re-using Goal type for projects for simplicity

const projectSchema = z.object({
  name: z.string().min(1, { message: 'اسم المشروع مطلوب.' }),
  description: z.string().optional(),
});


export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '' },
  });

  const projectsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // We can reuse the 'goals' collection with a special type field, or create a new 'projects' collection.
    // For simplicity, we'll use a new collection.
    return collection(firestore, `users/${user.uid}/projects`);
  }, [firestore, user]);

  const { data: projects, isLoading } = useCollection<Project>(projectsCollectionRef);

  const handleCreateProject = async (values: z.infer<typeof projectSchema>) => {
    if (!projectsCollectionRef || !user) return;
    setIsSubmitting(true);
    
    try {
        await addDoc(projectsCollectionRef, {
            ...values,
            userId: user.uid,
            progress: 0, // Initial progress
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({
            title: "تم إنشاء المشروع",
            description: "تم حفظ مشروعك الجديد بنجاح."
        });
        setIsDialogOpen(false);
        form.reset();
    } catch (error) {
        console.error("Error creating project:", error);
        toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء المشروع." });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!projectsCollectionRef) return;
    try {
        await deleteDoc(doc(projectsCollectionRef, projectId));
        toast({ title: "تم الحذف", description: "تم حذف المشروع بنجاح." });
    } catch (error) {
        console.error("Error deleting project:", error);
        toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المشروع." });
    }
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
             <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateProject)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>اسم المشروع</FormLabel>
                                <FormControl>
                                    <Input placeholder="مثال: إطلاق المنتج الجديد" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>وصف المشروع (اختياري)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="صف أهداف المشروع ومراحله الرئيسية" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
             </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !projects || projects.length === 0 ? (
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
          {projects.map(project => (
            <Card key={project.id}>
                <CardHeader>
                    <CardTitle className='flex justify-between items-start'>
                        {project.name}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProject(project.id)}>
                            <Trash2 className='h-4 w-4' />
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        {project.description || 'لا يوجد وصف لهذا المشروع.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Future: Add progress bar, task list, etc. */}
                    <p className="text-sm text-muted-foreground">سيتم عرض تفاصيل المشروع هنا قريباً.</p>
                </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
