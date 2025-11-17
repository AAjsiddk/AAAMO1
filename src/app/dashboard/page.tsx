"use client";

import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <div className="min-h-screen text-white px-6 py-8">

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex justify-between items-center shadow-lg"
      >
        <h1 className="text-2xl font-bold tracking-wide">لوحة التحكم</h1>
        <div className="flex items-center gap-4">
          <button className="bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition">
            الوضع الليلي/النهاري
          </button>
        </div>
      </motion.nav>

      {/* محتوى الواجهة */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* بطاقة */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl shadow-[0_0_25px_rgba(139,92,246,0.3)]"
        >
          <h2 className="text-xl font-bold mb-2">آخر المذكرات</h2>
          <p className="opacity-90">شاهد آخر ما كتبته بسهولة.</p>
        </motion.div>

        {/* بطاقة */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl shadow-[0_0_25px_rgba(139,92,246,0.3)]"
        >
          <h2 className="text-xl font-bold mb-2">متابعة التقدم</h2>
          <p className="opacity-90">حلّل تقدمك الأسبوعي بسهولة.</p>
        </motion.div>

        {/* بطاقة */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl shadow-[0_0_25px_rgba(139,92,246,0.3)]"
        >
          <h2 className="text-xl font-bold mb-2">مزاج اليوم</h2>
          <p className="opacity-90">سجّل حالتك النفسية.</p>
        </motion.div>

      </div>

      {/* Footer */}
      <div className="mt-12 text-center opacity-60">
        <p>© 2025 لوحتك المتطورة — النسخة المحسّنة</p>
      </div>

    </div>
  );
}
