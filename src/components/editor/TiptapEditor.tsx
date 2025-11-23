'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

const TiptapEditor = ({ content, onChange }: { content: string, onChange: (richText: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[400px] border border-input rounded-md p-4 bg-background text-foreground',
        },
    },
  });

  if (!editor) {
    return null;
  }
  
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }


  return (
    <div>
        <div className="flex flex-wrap items-center gap-2 p-2 border border-input rounded-t-md">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>Bold</button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>Italic</button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}>Underline</button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>Strike</button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>Bullet List</button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>Ordered List</button>
            <button type="button" onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''}>Set Link</button>
        </div>
        <EditorContent editor={editor} />
        <style jsx>{`
            button {
                @apply px-3 py-1 rounded-md border border-input text-sm;
            }
            button.is-active {
                @apply bg-primary text-primary-foreground;
            }
        `}</style>
    </div>
  );
};

export default TiptapEditor;
