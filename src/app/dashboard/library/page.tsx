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
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Loader2, Library, Book, Video, Link as LinkIcon, FileText, MessageCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LibraryItem } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

const itemSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب.' }),
  type: z.enum(['book', 'article', 'video', 'link']),
  source: z.string().min(1, { message: 'المصدر مطلوب.' }),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  impactfulQuote: z.string().optional(),
});

const typeIcons = {
  book: <Book className="h-6 w-6 text-accent-1" />,
  article: <FileText className="h-6 w-6 text-accent-1" />,
  video: <Video className="h-6 w-6 text-accent-1" />,
  link: <LinkIcon className="h-6 w-6 text-accent-1" />,
};

const typeTranslations = {
    book: 'كتاب',
    article: 'مقال',
    video: 'فيديو',
    link: 'رابط'
}


export default function LibraryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: { title: '', type: 'link', source: '', description: '', imageUrl: '', impactfulQuote: '' },
  });
  
  const itemType = form.watch('type');

  const libraryCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/libraryItems`);
  }, [firestore, user]);

  const itemsQuery = useMemoFirebase(() => {
    if (!libraryCollectionRef) return null;
    return query(libraryCollectionRef, orderBy('createdAt', 'desc'));
  }, [libraryCollectionRef]);

  const { data: items, isLoading: isLoadingItems } = useCollection<LibraryItem>(itemsQuery);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  const onSubmit = async (values: z.infer<typeof itemSchema>) => {
    if (!libraryCollectionRef || !user) return;
    setIsSubmitting(true);

    try {
      await addDoc(libraryCollectionRef, {
        ...values,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'نجاح', description: 'تمت إضافة العنصر إلى مكتبتك.' });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving library item: ", error);
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل حفظ العنصر.` });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteItem = async (itemId: string) => {
    if (!firestore || !user) return;
    const itemDocRef = doc(firestore, `users/${user.uid}/libraryItems`, itemId);
    try {
      await deleteDoc(itemDocRef);
      toast({ title: 'تم الحذف', description: 'تم حذف العنصر من المكتبة.' });
    } catch (error) {
      console.error("Error deleting item: ", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف العنصر.' });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">مكتبتي المعرفية</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة عنصر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة عنصر جديد لمكتبتك</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="اسم الكتاب, المقال, الفيديو..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="link">رابط</SelectItem>
                        <SelectItem value="video">فيديو</SelectItem>
                        <SelectItem value="article">مقال</SelectItem>
                        <SelectItem value="book">كتاب</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="source" render={({ field }) => (
                  <FormItem><FormLabel>المصدر</FormLabel><FormControl><Input placeholder="الرابط أو اسم الكتاب" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                {itemType === 'book' && (
                  <FormField control={form.control} name="impactfulQuote" render={({ field }) => (
                    <FormItem><FormLabel>جملة أثرت فيك (اختياري)</FormLabel><FormControl><Textarea placeholder="اكتب اقتباسًا أو فكرة لامستك" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}

                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem><FormLabel>رابط صورة (اختياري)</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Textarea placeholder="لماذا هذا العنصر مهم؟" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="ابحث عن عنصر في مكتبتك..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
       </div>

      {isLoadingItems && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>}

      {!isLoadingItems && filteredItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <Library className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">{items && items.length > 0 ? 'لم يتم العثور على نتائج' : 'مكتبتك فارغة'}</h3>
            <p className="text-muted-foreground max-w-md">
              {items && items.length > 0
                ? 'جرّب كلمة بحث مختلفة.'
                : 'ابدأ بإضافة كتب، مقالات، أو فيديوهات تهمك لرحلة تطوير ذاتك.'}
            </p>
            {(!items || items.length === 0) && (
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                <PlusCircle className="ml-2 h-4 w-4" /> إضافة عنصر جديد
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoadingItems && filteredItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col overflow-hidden card-glass">
              <CardHeader className="flex-row gap-4 items-start pb-4">
                <div className="flex-shrink-0 mt-1">{typeIcons[item.type]}</div>
                <div className="flex-grow">
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="text-muted">{typeTranslations[item.type]}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                {item.imageUrl && (
                    <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-md">
                        <Image src={item.imageUrl} alt={item.title} fill={true} className="object-cover" />
                    </div>
                )}
                {item.impactfulQuote && (
                  <blockquote className="border-r-2 border-accent-1 pr-4 italic text-muted mb-4">
                    "{item.impactfulQuote}"
                  </blockquote>
                )}
                {item.description && <p className="text-sm text-muted flex-grow mb-4">{item.description}</p>}
                
              </CardContent>
               <CardFooter>
                  <Button asChild variant="secondary" className="w-full">
                      <Link href={item.source} target="_blank" rel="noopener noreferrer">
                          الانتقال إلى المصدر <LinkIcon className="mr-2 h-4 w-4"/>
                      </Link>
                  </Button>
                </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
