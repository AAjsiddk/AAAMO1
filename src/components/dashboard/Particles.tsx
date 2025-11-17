import React from "react";

export function Particles(){
  return (
    <div className="particles" aria-hidden="true">
      <div 
        style={{
            position:"absolute", 
            right:"5%", 
            top:"8%", 
            width:300, 
            height:300, 
            opacity:0.12, 
            filter:"blur(40px)",
            background: "linear-gradient(135deg, var(--accent1), var(--accent2))",
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
            opacity:0.08, 
            filter:"blur(50px)",
            background: "var(--accent3)",
            borderRadius: "50%",
            animation: "blob-spin 25s linear infinite reverse"
         }}
      />
      <style jsx>{`
        @keyframes blob-spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
