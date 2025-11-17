'use client';
import React, { useEffect, useState, useRef } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc, limit, writeBatch, getDocs } from "firebase/firestore";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { chatWithBot } from "@/ai/flows/chat-flow";
import { Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AiDrawer({open, onClose}: {open: boolean, onClose: () => void}){
  const { user } = useUser();
  const firestore = useFirestore();
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const chatsCollectionRef = useMemoFirebase(() => 
    user ? collection(firestore, "users", user.uid, "ai_chats") : null
  , [user, firestore]);

  const messagesCollectionRef = useMemoFirebase(() =>
    user && currentChatId ? collection(firestore, "users", user.uid, "ai_chats", currentChatId, "messages") : null
  , [user, firestore, currentChatId]);

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

  useEffect(() => {
    if (!messagesCollectionRef) {
      setMessages([]);
      return;
    }
    const q = query(messagesCollectionRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({id:d.id, ...d.data()})));
      setTimeout(() => scroller.current?.scrollTo({top: scroller.current.scrollHeight, behavior:"smooth"}), 80);
    });
    return () => unsub();
  }, [messagesCollectionRef]);

  const newChat = async () => {
    if (!user || !chatsCollectionRef) return alert("Please login");
    const ref = await addDoc(chatsCollectionRef, {
      title: `محادثة ${chats.length + 1}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setCurrentChatId(ref.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !currentChatId || !messagesCollectionRef) return;
    
    const text = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await addDoc(messagesCollectionRef, {
        role: "user",
        content: text,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(firestore, "users", user.uid, "ai_chats", currentChatId), { updatedAt: serverTimestamp() }, { merge: true });

      const response = await chatWithBot({ query: text });
      
      const aiText = response.answer || "لم يتم الحصول على رد.";

      await addDoc(messagesCollectionRef, {
        role: "bot",
        content: aiText,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(firestore, "users", user.uid, "ai_chats", currentChatId), { updatedAt: serverTimestamp(), lastSnippet: aiText.slice(0,120) }, { merge:true });

    } catch(e){
      console.error(e);
      alert("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm("هل تريد حذف المحادثة؟") || !user || !firestore) return;
    try {
      const batch = writeBatch(firestore);
      const messagesQuery = query(collection(firestore, `users/${user.uid}/ai_chats/${chatId}/messages`));
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach(doc => batch.delete(doc.ref));
      const chatRef = doc(firestore, `users/${user.uid}/ai_chats`, chatId);
      batch.delete(chatRef);
      await batch.commit();

      if (currentChatId === chatId) setCurrentChatId(null);
    } catch (err) { console.error(err); }
  };
  
  if (!open) return null;

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{position:'fixed', right: 0, top: 0, height:'100vh', width:420, maxWidth: '100vw', zIndex:70}} 
      className="card-glass p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-xl">مساعدك الذكي</h3>
        <div className="flex gap-2">
          <button onClick={newChat} className="px-3 py-1 rounded bg-gradient-to-r from-accent1 to-accent2 text-black">محادثة جديدة</button>
          <button onClick={onClose} className="px-2 py-1 rounded border border-glass-border">إغلاق</button>
        </div>
      </div>

      <div className="flex gap-3 h-[calc(100%-60px)]">
        <div className="w-40 overflow-auto pr-2 border-r border-glass-border">
          {chats.map(c => (
            <div key={c.id} onClick={() => setCurrentChatId(c.id)} className={`p-2 mb-2 rounded cursor-pointer relative group ${currentChatId===c.id ? 'ring-2 ring-accent1' : 'hover:bg-white/10'}`}>
              <div className="font-medium truncate">{c.title || 'محادثة'}</div>
              <div className="text-xs text-muted line-clamp-2">{c.lastSnippet || '...'}</div>
               <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} className="absolute top-1 left-1 text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
               </button>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          <div ref={scroller} className="flex-1 overflow-auto p-2">
            {!currentChatId && <div className="text-muted text-center h-full flex items-center justify-center">اختر محادثة أو أنشئ جديدة</div>}
            <AnimatePresence>
            {messages.map(m => (
              <motion.div 
                key={m.id} 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 max-w-[85%] p-3 rounded-xl ${m.role==='user' ? 'ml-auto bg-accent1 text-black' : 'mr-auto bg-white/10 text-white'}`}
              >
                <div style={{whiteSpace:'pre-wrap'}}>{m.content}</div>
                <div className="text-xs text-muted/70 mt-1">{m.createdAt?.seconds ? new Date(m.createdAt.seconds*1000).toLocaleTimeString() : ''}</div>
              </motion.div>
            ))}
             {isLoading && (
              <motion.div initial={{ opacity: 0}} animate={{ opacity: 1 }} className="mr-auto bg-white/10 p-3 rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin" />
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="mt-2">
            <form onSubmit={(e) => {e.preventDefault(); sendMessage();}} className="flex gap-2">
              <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="اكتب رسالة..." className="flex-1 p-3 rounded-lg bg-transparent border border-glass-border outline-none focus:ring-2 focus:ring-accent1"/>
              <button type="submit" disabled={isLoading || !currentChatId} className="px-4 py-3 rounded-lg bg-gradient-to-r from-accent2 to-accent1 font-semibold text-black disabled:opacity-50">
                {isLoading ? "جارٍ..." : "إرسال"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
