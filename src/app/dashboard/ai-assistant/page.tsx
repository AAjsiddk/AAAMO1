'use client';
import React, { useEffect, useState, useRef } from "react";
import { collection, addDoc, doc, onSnapshot, query, orderBy, setDoc, serverTimestamp, deleteDoc, writeBatch, getDocs } from "firebase/firestore";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { chatWithBot } from "@/ai/flows/chat-flow";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AiAssistantPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [chats, setChats] = useState<any[]>([]); 
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatsCollectionRef = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "ai_chats") : null
  , [user, firestore]);

  const messagesCollectionRef = useMemoFirebase(() =>
    user && currentChatId ? collection(firestore, "users", user.uid, "ai_chats", currentChatId, "messages") : null
  , [user, firestore, currentChatId]);

  // Load chat list
  useEffect(() => {
    if (!chatsCollectionRef) return;
    const q = query(chatsCollectionRef, orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChats(arr.filter(c => !c.deleted));
    }, (err) => {
      console.error("Chat list error:", err);
    });
    return () => unsub();
  }, [chatsCollectionRef]);

  // Load selected chat messages
  useEffect(() => {
    if (!messagesCollectionRef) {
      setMessages([]);
      return;
    }
    const q = query(messagesCollectionRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(arr);
    }, (err) => console.error("Messages snapshot error:", err));
    return () => unsub();
  }, [messagesCollectionRef]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const newChat = async () => {
    if (!user || !chatsCollectionRef) return alert("You must be logged in");
    const docRef = await addDoc(chatsCollectionRef, {
      title: `محادثة ${chats.length + 1}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setCurrentChatId(docRef.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !currentChatId || !messagesCollectionRef) return;
    
    const text = input.trim();
    setInput("");
    
    // Add user message to state immediately for responsiveness
    const userMessage = { role: 'user', content: text, createdAt: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      await addDoc(messagesCollectionRef, {
        role: "user",
        content: text,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(firestore, "users", user.uid, "ai_chats", currentChatId), { updatedAt: serverTimestamp() }, { merge: true });

      const response = await chatWithBot({ query: text });
      const botMessage = { role: 'bot', content: response.answer };

      await addDoc(messagesCollectionRef, {
        ...botMessage,
        createdAt: serverTimestamp(),
      });

    } catch (err) {
      console.error("sendMessage error:", err);
       setMessages(prev => prev.slice(0, prev.length - 1)); // Rollback optimistic update
       alert("حدث خطأ أثناء الإرسال.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!user || !firestore) return;
    if (!confirm("هل أنت متأكد من حذف هذه المحادثة وكل رسائلها؟")) return;

    try {
        const chatDocRef = doc(firestore, "users", user.uid, "ai_chats", chatId);
        const messagesQuery = query(collection(firestore, "users", user.uid, "ai_chats", chatId, "messages"));
        const messagesSnapshot = await getDocs(messagesQuery);

        const batch = writeBatch(firestore);
        messagesSnapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(chatDocRef);

        await batch.commit();

        if (currentChatId === chatId) {
            setCurrentChatId(null);
        }
    } catch (err) {
        console.error("Error deleting chat:", err);
    }
  };


  return (
    <div className="flex h-[calc(100vh_-_4rem)] bg-bg text-gray-100 font-inter">
      <aside className="w-72 bg-card-bg p-4 border-l border-glass-border overflow-auto flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="font-bold text-lg">الذكاء المساعد</h3>
          <Button onClick={newChat} size="sm" className="bg-gradient-to-r from-accent-1 to-accent-2 text-white font-semibold">محادثة جديدة</Button>
        </div>

        <div className="space-y-2 flex-grow overflow-y-auto">
          {chats.length === 0 && <div className="text-muted text-sm text-center py-8">لا توجد محادثات بعد</div>}
          {chats.map(c => (
            <div key={c.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${currentChatId === c.id ? "ring-2 ring-accent-1 bg-card-bg/50" : "hover:bg-white/5"}`} onClick={() => setCurrentChatId(c.id)}>
              <div className="flex justify-between items-start">
                <div className="font-medium truncate flex-grow pr-2">{c.title || "محادثة"}</div>
                <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} className="text-xs text-danger/70 hover:text-danger flex-shrink-0">حذف</button>
              </div>
               <div className="text-xs text-muted mt-1">{c.updatedAt ? new Date(c.updatedAt.seconds * 1000).toLocaleDateString() : ""}</div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col" style={{ background: "linear-gradient(180deg, rgba(7,6,24,1), rgba(9,10,28,1))" }}>
        <div className="flex-1 overflow-auto p-6">
          {!currentChatId && (
            <div className="flex items-center justify-center h-full text-muted">
                <p>اختر محادثة من القائمة أو أنشئ محادثة جديدة للبدء.</p>
            </div>
          )}
          {messages.map((m, index) => (
            <div key={m.id || `msg-${index}`} className={`mb-4 flex flex-col max-w-[70%] p-3 rounded-xl ${m.role === "user" ? "ml-auto bg-accent-1 text-white" : "mr-auto bg-white/10"}`}>
              <div style={{ whiteSpace: "pre-wrap" }} className="text-sm md:text-base">{m.content}</div>
            </div>
          ))}
           {isLoading && (
              <div className="mr-auto bg-white/10 p-3 rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-glass-border bg-card-bg">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب رسالة..." className="flex-1 p-3 rounded-lg bg-transparent border border-glass-border outline-none focus:ring-2 focus:ring-accent-1" />
            <Button type="submit" disabled={isLoading || !currentChatId} className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-2 to-accent-1 font-semibold text-white">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "إرسال"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
