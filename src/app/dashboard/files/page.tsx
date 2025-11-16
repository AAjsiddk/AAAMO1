'use client';
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, serverTimestamp, doc, addDoc, deleteDoc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
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
  ChevronRight,
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

  const [path, setPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'الجذر' }]);
  const currentFolderId = useMemo(() => path[path.length - 1]?.id || null, [path]);

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingItem, setEditingItem] = useState<{ type: 'folder' | 'file'; data: Folder | FileType } | null>(null);
  
  const [itemToDelete, setItemToDelete] = useState<{ type: 'folder' | 'file'; id: string } | null>(null);

  const folderForm = useForm<z.infer<typeof folderSchema>>({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: '' },
  });
  
  const fileForm = useForm<z.infer<typeof fileSchema>>({
    resolver: zodResolver(fileSchema),
     defaultValues: {
      name: '',
    },
  });

  const fileRef = fileForm.register("file");

  const foldersCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/folders`);
  }, [user, firestore]);

  const filesCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
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

  const handleCreateOrUpdateFolder = async (values: z.infer<typeof folderSchema>) => {
    if (!user || !foldersCollectionRef) return;
    setIsSubmitting(true);
    try {
        if(editingItem && editingItem.type === 'folder') {
            const folderDocRef = doc(firestore, `users/${user.uid}/folders`, editingItem.data.id);
            await updateDoc(folderDocRef, { name: values.name });
            toast({ title: 'نجاح', description: 'تم تحديث المجلد.' });
        } else {
            const newFolder: Omit<Folder, 'id'> = {
                name: values.name,
                userId: user.uid,
                parentId: currentFolderId,
                createdAt: serverTimestamp(),
            };
            await addDoc(foldersCollectionRef, newFolder);
            toast({ title: 'نجاح', description: 'تم إنشاء المجلد.' });
        }
      folderForm.reset();
      setIsFolderDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving folder: ", error);
      toast({ variant: 'destructive', title: 'خطأ', description: `فشل ${editingItem ? 'تحديث' : 'إنشاء'} المجلد.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (item: Folder | FileType, type: 'folder' | 'file') => {
    setEditingItem({ type, data: item });
    folderForm.setValue('name', item.name); // Using one form for rename
    setIsFolderDialogOpen(true);
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
  
  const handleDeleteItem = async () => {
    if (!user || !firestore || !itemToDelete) return;

    try {
        if (itemToDelete.type === 'folder') {
            const foldersToDelete = new Set<string>([itemToDelete.id]);
            const foldersToCheck = [itemToDelete.id];

            // Recursively find all sub-folders to delete
            while (foldersToCheck.length > 0) {
                const currentId = foldersToCheck.pop()!;
                const subFoldersQuery = query(collection(firestore, `users/${user.uid}/folders`), where('parentId', '==', currentId));
                const subFoldersSnapshot = await getDocs(subFoldersQuery);
                subFoldersSnapshot.forEach(doc => {
                    foldersToDelete.add(doc.id);
                    foldersToCheck.push(doc.id);
                });
            }

            const batch = writeBatch(firestore);

            // Delete all files within these folders
            for (const folderId of foldersToDelete) {
                const filesInFolderQuery = query(collection(firestore, `users/${user.uid}/files`), where('folderId', '==', folderId));
                const filesSnapshot = await getDocs(filesInFolderQuery);
                filesSnapshot.forEach(doc => batch.delete(doc.ref));
            }
            
            // Delete all the folders
            foldersToDelete.forEach(id => {
                const folderRef = doc(firestore, `users/${user.uid}/folders`, id);
                batch.delete(folderRef);
            });

            await batch.commit();
            toast({ title: 'تم الحذف', description: 'تم حذف المجلد وكل محتوياته بنجاح.' });

        } else { // Deleting a file
            const fileRef = doc(firestore, `users/${user.uid}/files`, itemToDelete.id);
            // TODO: Also delete file from Firebase Storage
            await deleteDoc(fileRef);
            toast({ title: 'تم الحذف', description: 'تم حذف الملف بنجاح.' });
        }
    } catch (error) {
        console.error(`Error deleting ${itemToDelete.type}: `, error);
        toast({ variant: 'destructive', title: 'خطأ', description: `فشل حذف الـ ${itemToDelete.type === 'folder' ? 'مجلد' : 'ملف'}.` });
    } finally {
        setItemToDelete(null);
    }
  };


  const navigateToFolder = (folderId: string | null, folderName: string) => {
     if (folderId === null) {
        setPath([{ id: null, name: 'الجذر' }]);
        return;
      }
      const index = path.findIndex(p => p.id === folderId);
      if (index !== -1) {
        setPath(path.slice(0, index + 1));
      } else {
        setPath([...path, { id: folderId, name: folderName }]);
      }
  };

  const handleFileClick = (file: FileType) => {
    // Placeholder for actual file download from Firebase Storage
    toast({
      title: 'بدء تحميل الملف',
      description: `سيتم تحميل ملف "${file.name}".`,
    });
    // In a real app, you would get the download URL from Storage and create a link.
    // const link = document.createElement('a');
    // link.href = file.storagePath; // This would be the download URL
    // link.download = file.name;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'folder' 
                ? 'هذا الإجراء سيحذف المجلد وكل محتوياته من مجلدات فرعية وملفات. لا يمكن التراجع عن هذا الإجراء.'
                : 'هذا الإجراء سيحذف الملف بشكل دائم ولا يمكن التراجع عنه.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>متابعة</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الملفات والمجلدات</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Dialog open={isFolderDialogOpen} onOpenChange={(open) => { setIsFolderDialogOpen(open); if (!open) { setEditingItem(null); folderForm.reset(); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingItem(null); setIsFolderDialogOpen(true); }}>
                <PlusCircle className="ml-2 h-4 w-4" />
                مجلد جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingItem ? `إعادة تسمية "${editingItem.data.name}"` : 'إنشاء مجلد جديد'}</DialogTitle></DialogHeader>
              <Form {...folderForm}>
                <form onSubmit={folderForm.handleSubmit(handleCreateOrUpdateFolder)} className="space-y-4">
                  <FormField
                    control={folderForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم</FormLabel>
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
                      {editingItem ? 'حفظ التعديل' : 'إنشاء'}
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
      
       <div className="flex items-center gap-2 text-sm text-muted-foreground rtl">
        {path.map((p, i) => (
            <React.Fragment key={p.id || 'root'}>
            <Button variant="link" className="p-0 h-auto" onClick={() => navigateToFolder(p.id, p.name)}>
                {p.name}
            </Button>
            {i < path.length - 1 && <ChevronRight className="h-4 w-4 transform scale-x-[-1]" />}
            </React.Fragment>
        ))}
      </div>


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
              onDoubleClick={() => navigateToFolder(folder.id, folder.name)}
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
                    <DropdownMenuItem onSelect={() => openEditDialog(folder, 'folder')}>
                      <Edit className="ml-2 h-4 w-4" />
                      <span>إعادة تسمية</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setItemToDelete({ type: 'folder', id: folder.id })} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="ml-2 h-4 w-4" />
                        <span>حذف</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
          {files?.map((file) => (
            <Card key={file.id} className="group relative cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleFileClick(file)}>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileIcon className="h-16 w-16 text-muted-foreground" />
                <span className="mt-2 font-medium truncate w-full text-center">{file.name}</span>
              </CardContent>
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); setItemToDelete({ type: 'file', id: file.id })}} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="ml-2 h-4 w-4" />
                        <span>حذف</span>
                    </DropdownMenuItem>
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
