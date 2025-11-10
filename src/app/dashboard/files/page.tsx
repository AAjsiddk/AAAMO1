'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, serverTimestamp, doc, addDoc, deleteDoc } from 'firebase/firestore';
import type { Folder, File as FileType } from '@/lib/types';
import {
  PlusCircle,
  Loader2,
  Folder as FolderIcon,
  File as FileIcon,
  MoreVertical,
  Trash2,
  Edit,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


const folderSchema = z.object({
  name: z.string().min(1, { message: 'اسم المجلد مطلوب.' }),
});

const fileSchema = z.object({
    name: z.string().min(1, { message: "اسم الملف مطلوب" }),
    file: z.instanceof(FileList).refine((files) => files?.length === 1, "الملف مطلوب."),
});


export default function FilesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const folderForm = useForm<z.infer<typeof folderSchema>>({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: '' },
  });
  
  const fileForm = useForm<z.infer<typeof fileSchema>>({
    resolver: zodResolver(fileSchema)
  });

  const fileRef = fileForm.register("file");


  const foldersCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/folders`);
  }, [user, firestore]);

  const filesCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/files`);
  }, [user, firestore]);


  const foldersQuery = useMemoFirebase(() => {
    if (!foldersCollectionRef) return null;
    return query(foldersCollectionRef, where('parentId', '==', currentFolderId));
  }, [foldersCollectionRef, currentFolderId]);

  const filesQuery = useMemoFirebase(() => {
    if (!filesCollectionRef) return null;
    return query(filesCollectionRef, where('folderId', '==', currentFolderId));
  }, [filesCollectionRef, currentFolderId]);

  const { data: folders, isLoading: isLoadingFolders } = useCollection<Folder>(foldersQuery);
  const { data: files, isLoading: isLoadingFiles } = useCollection<FileType>(filesQuery);

  const isLoading = isLoadingFolders || isLoadingFiles;

  const handleCreateFolder = async (values: z.infer<typeof folderSchema>) => {
    if (!user || !foldersCollectionRef) return;
    setIsSubmitting(true);
    try {
      const newFolder: Omit<Folder, 'id'> = {
        name: values.name,
        userId: user.uid,
        parentId: currentFolderId,
        createdAt: serverTimestamp(),
      };
      await addDoc(foldersCollectionRef, newFolder);
      toast({ title: 'نجاح', description: 'تم إنشاء المجلد.' });
      folderForm.reset();
      setIsFolderDialogOpen(false);
    } catch (error) {
      console.error("Error creating folder: ", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل إنشاء المجلد.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUploadFile = async (values: z.infer<typeof fileSchema>) => {
    if (!user || !filesCollectionRef) return;
    setIsSubmitting(true);
    
    try {
      const file = values.file[0];
      
      // NOTE: This is a placeholder for actual file upload to Firebase Storage.
      // We are only creating the Firestore document here.
      const newFile: Omit<FileType, 'id'> = {
        name: values.name,
        userId: user.uid,
        folderId: currentFolderId,
        storagePath: `users/${user.uid}/files/${file.name}`, // Placeholder path
        fileType: file.type,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(filesCollectionRef, newFile);
      
      toast({ title: 'نجاح', description: 'تم رفع معلومات الملف.' });
      fileForm.reset();
      setIsFileDialogOpen(false);
    } catch (error) {
       console.error("Error uploading file info: ", error);
       toast({ variant: 'destructive', title: 'خطأ', description: 'فشل رفع معلومات الملف.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: 'folder' | 'file', id: string) => {
    if (!user || !firestore) return;
    const ref = doc(firestore, `users/${user.uid}/${type}s`, id);
    try {
      // TODO: Also delete contents of folder or file from storage
      await deleteDoc(ref);
      toast({ title: 'تم الحذف', description: `تم حذف الـ ${type === 'folder' ? 'مجلد' : 'ملف'} بنجاح.` });
    } catch (error) {
       console.error(`Error deleting ${type}: `, error);
       toast({ variant: 'destructive', title: 'خطأ', description: `فشل حذف الـ ${type === 'folder' ? 'مجلد' : 'ملف'}.`});
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الملفات والمجلدات</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                مجلد جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إنشاء مجلد جديد</DialogTitle></DialogHeader>
              <Form {...folderForm}>
                <form onSubmit={folderForm.handleSubmit(handleCreateFolder)} className="space-y-4">
                  <FormField
                    control={folderForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المجلد</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: مشاريعي" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      إنشاء
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
            <DialogTrigger asChild>
               <Button variant="secondary">
                <UploadCloud className="ml-2 h-4 w-4" />
                رفع ملف
              </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>رفع ملف جديد</DialogTitle></DialogHeader>
                 <Form {...fileForm}>
                    <form onSubmit={fileForm.handleSubmit(handleUploadFile)} className="space-y-4">
                        <FormField
                            control={fileForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم الملف</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: تقرير الربع الأول" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={fileForm.control}
                            name="file"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الملف</FormLabel>
                                    <FormControl>
                                        <Input type="file" {...fileRef} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                رفع
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {currentFolderId && (
            <Button variant="ghost" onClick={() => setCurrentFolderId(null)}>
                العودة إلى الجذر
            </Button>
        )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!folders || folders.length === 0) && (!files || files.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <FolderIcon className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">المجلد فارغ</h3>
            <p className="text-muted-foreground">
              ابدأ بتنظيم ملفاتك عن طريق إنشاء مجلد جديد أو رفع ملف.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && ((folders && folders.length > 0) || (files && files.length > 0)) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {folders?.map((folder) => (
            <Card
              key={folder.id}
              className="group relative cursor-pointer hover:shadow-lg transition-shadow"
              onDoubleClick={() => setCurrentFolderId(folder.id)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FolderIcon className="h-16 w-16 text-primary" />
                <span className="mt-2 font-medium truncate w-full text-center">{folder.name}</span>
              </CardContent>
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="ml-2 h-4 w-4" />
                      <span>إعادة تسمية</span>
                    </DropdownMenuItem>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                             <Trash2 className="ml-2 h-4 w-4" />
                             <span>حذف</span>
                           </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من حذف المجلد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              هذا الإجراء سيحذف المجلد وكل محتوياته ولا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete('folder', folder.id)}>متابعة</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
          {files?.map((file) => (
            <Card key={file.id} className="group relative cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileIcon className="h-16 w-16 text-muted-foreground" />
                <span className="mt-2 font-medium truncate w-full text-center">{file.name}</span>
              </CardContent>
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="ml-2 h-4 w-4" />
                      <span>إعادة تسمية</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                             <Trash2 className="ml-2 h-4 w-4" />
                             <span>حذف</span>
                           </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من حذف الملف؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete('file', file.id)}>متابعة</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
