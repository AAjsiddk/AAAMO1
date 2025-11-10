'use client';
import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Folder, File as FileType } from '@/lib/types';
import { PlusCircle, Loader2, Folder as FolderIcon, File as FileIcon, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function FilesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Memoized query for folders
  const foldersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/folders`),
      where('parentId', '==', currentFolderId)
    );
  }, [user, firestore, currentFolderId]);

  // Memoized query for files
  const filesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/files`),
      where('folderId', '==', currentFolderId)
    );
  }, [user, firestore, currentFolderId]);

  const { data: folders, isLoading: isLoadingFolders } = useCollection<Folder>(foldersQuery);
  const { data: files, isLoading: isLoadingFiles } = useCollection<FileType>(filesQuery);

  const isLoading = isLoadingFolders || isLoadingFiles;

  const handleCreateFolder = () => {
    // TODO: Implement folder creation logic
    console.log('Create new folder');
  };

  const handleUploadFile = () => {
    // TODO: Implement file upload logic
    console.log('Upload new file');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">الملفات والمجلدات</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateFolder}>
            <PlusCircle className="ml-2 h-4 w-4" />
            مجلد جديد
          </Button>
          <Button variant="secondary" onClick={handleUploadFile}>
            <PlusCircle className="ml-2 h-4 w-4" />
            رفع ملف
          </Button>
        </div>
      </div>

      {/* TODO: Add Breadcrumbs here */}

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
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="ml-2 h-4 w-4" />
                        <span>حذف</span>
                      </DropdownMenuItem>
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
                      <DropdownMenuItem className="text-destructive">
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
