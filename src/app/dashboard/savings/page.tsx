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
import { collection, doc, serverTimestamp, query, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Loader2, PiggyBank, Inbox, Banknote, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Saving } from '@/lib/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const savingSchema = z.object({
  amount: z.coerce.number().refine(val => val !== 0, { message: 'يجب أن لا يكون المبلغ صفرًا.' }),
  note: z.string().optional(),
});

export default function SavingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof savingSchema>>({
    resolver: zodResolver(savingSchema),
    defaultValues: { amount: 0, note: '' },
  });

  const savingsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/savings`);
  }, [firestore, user]);

  const savingsQuery = useMemoFirebase(() => {
    if (!savingsCollectionRef) return null;
    return query(savingsCollectionRef, orderBy('createdAt', 'desc'));
  }, [savingsCollectionRef]);

  const { data: savings, isLoading } = useCollection<Saving>(savingsQuery);

  const totalSavings = useMemo(() => {
    if (!savings) return 0;
    return savings.reduce((acc, curr) => acc + curr.amount, 0);
  }, [savings]);

  const handleSave = async (values: z.infer<typeof savingSchema>) => {
    if (!savingsCollectionRef || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(savingsCollectionRef, {
        ...values,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'تم الحفظ',
        description: `تمت إضافة معاملة بمبلغ ${values.amount}.`,
      });
      form.reset({amount: 0, note: ''});
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ المعاملة.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (savingId: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, `users/${user.uid}/savings`, savingId);
    try {
      await deleteDoc(docRef);
      toast({ title: 'تم الحذف' });
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الإيداع.' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">تحويشتي</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="ml-2 h-4 w-4" /> إضافة معاملة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة معاملة جديدة</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl><Input type="number" step="any" placeholder="مبلغ موجب للإضافة، وسالب للخصم" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="note" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظة (اختياري)</FormLabel>
                    <FormControl><Input placeholder="مثال: من الراتب، شراء قهوة..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} إضافة
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PiggyBank className="text-primary"/> إجمالي الحصالة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {totalSavings.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات</CardTitle>
          <CardDescription>هنا تظهر كل المبالغ التي أضفتها أو خصمتها.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {!isLoading && (!savings || savings.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center border-2 border-dashed rounded-lg">
              <Inbox className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">حصالتك فارغة</h3>
              <p className="text-muted-foreground">ابدأ بإضافة أول مبلغ لرحلة الادخار.</p>
            </div>
          ) : (
             <div className="space-y-4">
                {savings?.map(item => (
                  <Card key={item.id} className={cn("bg-muted/50", item.amount > 0 ? "border-green-500/20" : "border-red-500/20")}>
                    <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {item.amount > 0 ? <TrendingUp className="h-6 w-6 text-green-500" /> : <TrendingDown className="h-6 w-6 text-red-500" />}
                            <div>
                                <p className={cn("font-bold text-lg", item.amount > 0 ? "text-green-500" : "text-red-500")}>
                                    {item.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}
                                </p>
                                <p className="text-sm text-muted-foreground">{item.note}</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {item.createdAt ? format(item.createdAt.toDate(), 'PPP', { locale: ar }) : ''}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </CardContent>
                  </Card>
                ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
