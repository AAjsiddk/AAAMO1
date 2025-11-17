'use client';
import React, { useEffect, useState } from "react";
import { useUser } from '@/firebase';
import { Particles } from "@/components/dashboard/Particles";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function LiveTime() {
  const [time, setTime] = useState(new Date());

  useEffect(()=> {
    const timer = setInterval(()=> setTime(new Date()), 1000);
    return ()=>clearInterval(timer);
  },[]);

  return (
    <div>
        <div className="text-5xl font-bold tracking-tight">{time.toLocaleTimeString('ar-SA')}</div>
        <p className="text-muted mt-2">{time.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  )
}

function Celebration() {
    return (
        <div style={{position:'fixed', inset:0, zIndex:80, pointerEvents:'none'}}>
            <div style={{position:'absolute', left:'50%', top:'30%', transform:'translateX(-50%)'}}>
                <div className="flex gap-2">
                    <motion.div 
                        className="w-4 h-8 bg-accent3 rounded" 
                        animate={{ rotate: 360, scale: [1, 1.5, 1] }} 
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                        className="w-4 h-8 bg-accent1 rounded"
                         animate={{ y: [0, -20, 0] }}
                         transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div 
                        className="w-4 h-8 bg-accent2 rounded"
                         animate={{ rotate: -360, scale: [1, 1.5, 1] }}
                         transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage(){
  const { user } = useUser();
  const [zen, setZen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const sampleData = [
    {name:'Mon', v:40},{name:'Tue', v:60},{name:'Wed', v:55},{name:'Thu', v:75},{name:'Fri', v:68},{name:'Sat', v:80},{name:'Sun', v:70}
  ];

  const triggerAchievement = () => {
    setCelebrate(true);
    setTimeout(()=> setCelebrate(false), 2200);
  };

  return (
    <div className="min-h-screen relative p-4 md:p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <div className="text-xl text-muted">مرحباً بعودتك،</div>
          <motion.h1 initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="text-4xl font-extrabold">
            {user?.displayName || "مستخدم"}!
          </motion.h1>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={()=> setZen(!zen)} className="p-2 rounded bg-card-bg border border-glass-border hidden md:block">{zen ? "Exit Zen" : "Zen Mode"}</button>
          <button onClick={triggerAchievement} className="p-2 rounded bg-gradient-to-r from-accent1 to-accent2 text-black">أنجزت شيئًا!</button>
        </div>
      </header>

      <div className={`grid ${zen ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-6`}>
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className={`card-glass p-6 ${zen ? 'md:col-span-1' : 'md:col-span-2'}`}>
           <LiveTime />
          <div className="my-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">إنتاجية الأسبوع</div>
              <div className="font-semibold">72%</div>
            </div>
            <div className="w-full bg-white/10 h-3 rounded-full mt-2 overflow-hidden">
              <motion.div 
                className="h-3 rounded-full" 
                style={{background:'linear-gradient(90deg,var(--accent1),var(--accent2))'}}
                initial={{width: 0}}
                animate={{width: '72%'}}
                transition={{duration: 1, ease: "easeOut"}}
              />
            </div>
          </div>
          <div style={{height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--glass-border)' }} />
                <Line type="monotone" dataKey="v" stroke="var(--accent1)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <aside className="space-y-6">
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="card-glass p-4">
            <h4 className="font-semibold">آخر المذكرات</h4>
            <p className="text-sm text-muted mt-2">لحظة سعيدة — Nov 17</p>
            <div className="mt-3">
              <button className="w-full py-2 rounded-lg bg-gradient-to-r from-accent1 to-accent2 text-black">فتح المذكرات</button>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="card-glass p-4">
            <h4 className="font-semibold">اقتباس اليوم</h4>
            <p className="text-sm text-muted mt-2">"ابدأ صغيراً، ثم لا تتوقف."</p>
          </motion.div>
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.4}} className="card-glass p-4">
            <h4 className="font-semibold">متتبع المزاج</h4>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-card-bg/50 border border-glass-border">😊</button>
              <button className="px-3 py-1 rounded bg-card-bg/50 border border-glass-border">😐</button>
              <button className="px-3 py-1 rounded bg-card-bg/50 border border-glass-border">😔</button>
            </div>
          </motion.div>
        </aside>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className="card-glass p-4">
          <h5 className="font-semibold">تذكيرات</h5>
          <ul className="text-sm text-muted mt-2">
            <li>◦ اجتماع 4 م</li>
            <li>◦ تسجيل يومي</li>
          </ul>
        </motion.div>
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.6}} className="card-glass p-4">
          <h5 className="font-semibold">الطقس</h5>
          <p className="text-sm text-muted mt-2">القاهرة — 28°م (بيانات تجريبية)</p>
        </motion.div>
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.7}} className="card-glass p-4">
          <h5 className="font-semibold">تقدم الأسبوع</h5>
          <div className="text-sm text-muted mt-2">انظر الرسم البياني لمزيد من التفاصيل</div>
        </motion.div>
      </div>
      {celebrate && <Celebration />}
    </div>
  );
}
