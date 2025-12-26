'use client';
import React from "react";

export function Particles(){
  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <div 
        style={{
            position:"absolute", 
            right:"5%", 
            top:"8%", 
            width:300, 
            height:300, 
            opacity:0.2, 
            filter:"blur(80px)",
            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "blob-spin 20s linear infinite"
        }} 
      />
      <div 
         style={{
            position:"absolute", 
            left:"8%", 
            bottom:"10%", 
            width:260, 
            height:260, 
            opacity:0.15, 
            filter:"blur(90px)",
            background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "blob-spin 25s linear infinite reverse"
         }}
      />
      <style jsx>{`
        @keyframes blob-spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.2); }
            100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
