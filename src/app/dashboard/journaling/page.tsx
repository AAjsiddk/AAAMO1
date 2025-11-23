'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote, Minus, Link2 } from 'lucide-react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';


const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    const ToolbarButton = ({ onClick, isActive, children }: { onClick: () => void, isActive: boolean, children: React.ReactNode }) => (
        <Button
            type="button"
            variant={isActive ? 'secondary' : 'ghost'}
            size="icon"
            onClick={onClick}
            className="h-8 w-8"
        >
            {children}
        </Button>
    );

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough className="h-4 w-4" /></ToolbarButton>
            <div className="w-[1px] h-6 bg-border mx-1" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}><Quote className="h-4 w-4" /></ToolbarButton>
            <div className="w-[1px] h-6 bg-border mx-1" />
            <ToolbarButton onClick={setLink} isActive={editor.isActive('link')}><Link2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} isActive={false}><Minus className="h-4 w-4" /></ToolbarButton>
        </div>
    );
};


export default function JournalingPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: content,
    onUpdate({ editor }) {
      setContent(editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none min-h-[calc(100vh-20rem)] w-full p-4',
        },
    },
  });

  useEffect(() => {
    if (user && firestore && editor) {
      setIsLoading(true);
      const journalDocRef = doc(firestore, `users/${user.uid}/journaling`, 'main');
      getDoc(journalDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const dbContent = docSnap.data().content;
            setContent(dbContent);
            editor.commands.setContent(dbContent, false);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!user && !firestore) {
        setIsLoading(false);
    }
  }, [user, firestore, editor]);

  const handleSave = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول لحفظ المذكرة.' });
      return;
    }
    setIsSaving(true);
    try {
      const journalDocRef = doc(firestore, `users/${user.uid}/journaling`, 'main');
      await setDoc(journalDocRef, {
        content: content,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: 'تم الحفظ', description: 'تم حفظ مذكرتك بنجاح.' });
    } catch (error) {
      console.error('Error saving journal:', error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ المذكرة.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between space-y-2 p-4 md:p-8 md:pb-4 border-b">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">المذكرة</h2>
              <p className="text-muted-foreground">
                    هنا يمكنك تدوين أفكارك، وخواطرك، وتأملاتك. هذه هي صفحتك البيضاء.
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                حفظ
            </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
            <Card className="m-4 md:m-8 mt-0 md:mt-4 border-none shadow-none md:border md:shadow-sm">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-96">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="relative">
                            <TiptapToolbar editor={editor} />
                            <EditorContent editor={editor} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
