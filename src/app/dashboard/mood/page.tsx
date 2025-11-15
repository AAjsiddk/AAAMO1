'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smile, Loader2 } from 'lucide-react';
import { useCollection, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { JournalEntry } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip as ReactTooltip } from 'react-tooltip'
import { subYears, format } from 'date-fns';

const moodTranslations: { [key in NonNullable<JournalEntry['mood']>]: string } = {
    happy: 'سعيد',
    sad: 'حزين',
    neutral: 'محايد',
    excited: 'متحمس',
    anxious: 'قلق',
};

const COLORS = {
    happy: '#22c55e',
    excited: '#f59e0b',
    neutral: '#6b7280',
    anxious: '#8b5cf6',
    sad: '#3b82f6',
};

const heatmapColors = {
  happy: 'rgba(34, 197, 94, 1)',
  excited: 'rgba(245, 158, 11, 1)',
  neutral: 'rgba(107, 114, 128, 0.7)',
  anxious: 'rgba(139, 92, 246, 1)',
  sad: 'rgba(59, 130, 246, 1)',
};


export default function MoodPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const journalQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/journalEntries`), orderBy('createdAt', 'desc'));
  }, [user, firestore]);

  const { data: entries, isLoading } = useCollection<JournalEntry>(journalQuery);

  const moodData = useMemo(() => {
    if (!entries) return [];
    const counts = entries.reduce((acc, entry) => {
        if (entry.mood) {
            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        }
        return acc;
    }, {} as {[key in NonNullable<JournalEntry['mood']>]: number});

    return Object.entries(counts).map(([mood, count]) => ({
        name: moodTranslations[mood as keyof typeof moodTranslations],
        value: count,
        fill: COLORS[mood as keyof typeof COLORS],
    }));
  }, [entries]);
  
  const heatmapData = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => e.mood).map(entry => ({
        date: format((entry.createdAt as any).toDate(), 'yyyy-MM-dd'),
        mood: entry.mood,
    }));
  }, [entries]);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">مرآة الذات اليومية</h2>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : !entries || entries.length === 0 ? (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
                <Smile className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">لا توجد بيانات لعرضها</h3>
                <p className="text-muted-foreground max-w-md">
                    ابدأ بتسجيل حالتك المزاجية من خلال كتابة المذكرات أو استخدام زر الحالة المزاجية في الشريط العلوي.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>توزيع الحالات المزاجية</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {moodData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>خريطة الحالة المزاجية</CardTitle>
                    <CardDescription>نظرة على حالتك المزاجية خلال العام الماضي.</CardDescription>
                </CardHeader>
                <CardContent>
                     <CalendarHeatmap
                        startDate={subYears(new Date(), 1)}
                        endDate={new Date()}
                        values={heatmapData}
                        classForValue={(value) => {
                            if (!value || !value.mood) { return 'color-empty'; }
                            return `color-mood-${value.mood}`;
                        }}
                        tooltipDataAttrs={(value: {date: string, mood: keyof typeof moodTranslations}) => {
                             if (!value || !value.date) return {};
                             return {
                                'data-tooltip-id': 'heatmap-tooltip',
                                'data-tooltip-content': `${value.date}: ${moodTranslations[value.mood] || 'غير معروف'}`,
                             };
                        }}
                    />
                    <ReactTooltip id="heatmap-tooltip" />
                    <style>{`
                        .react-calendar-heatmap .color-mood-happy { fill: ${heatmapColors.happy}; }
                        .react-calendar-heatmap .color-mood-excited { fill: ${heatmapColors.excited}; }
                        .react-calendar-heatmap .color-mood-neutral { fill: ${heatmapColors.neutral}; }
                        .react-calendar-heatmap .color-mood-anxious { fill: ${heatmapColors.anxious}; }
                        .react-calendar-heatmap .color-mood-sad { fill: ${heatmapColors.sad}; }
                    `}</style>
                </CardContent>
            </Card>
        </div>
      )}

    </div>
  );
}
