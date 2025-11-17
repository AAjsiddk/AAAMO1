'use client';
import React, { useState } from "react";
import AiDrawer from "./AiDrawer";

export default function FABChat(){
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <>
        <button 
            className="fixed right-6 bottom-6 z-50 w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-accent2 to-accent1 text-black font-bold text-2xl shadow-soft-glow hover:scale-105 transition-transform"
            onClick={() => setOpenDrawer(true)} 
            title="AI Assistant"
        >
            AI
        </button>
        <AiDrawer open={openDrawer} onClose={() => setOpenDrawer(false)} />
    </>
  );
}
