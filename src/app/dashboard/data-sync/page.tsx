'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs } from 'firebase/firestore';
import { Download, Upload, Loader2, FileJson, FileImage } from 'lucide-react';
import { useState, useCallback } from 'react';
import { generateSummaryImage } from '@/ai/flows/generate-summary-image';
import { toPng } from 'html-to-image';
import type { Task, Goal, Habit } from '@/lib/types';


const collectionsToExport = [
    'tasks', 'goals', 'habits', 'journalEntries', 'files', 'folders', 
    'futureMessages', 'libraryItems', 'worshipActs', 'relaxationActivities', 'notes'
];

export default function DataSyncPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const tasksQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/tasks`) : null), [user, firestore]);
    const goalsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/goals`) : null), [user, firestore]);
    const habitsQuery = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/habits`) : null), [user, firestore]);

    const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksQuery);
    const { data: goals, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery);
    const { data: habits, isLoading: loadingHabits } = useCollection<Habit>(habitsQuery);


    const handleExport = async () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول لتصدير البيانات.' });
            return;
        }
        setIsExporting(true);

        try {
            const data: { [key: string]: any[] } = {};
            for (const collectionName of collectionsToExport) {
                const colRef = collection(firestore, `users/${user.uid}/${collectionName}`);
                const snapshot = await getDocs(colRef);
                data[collectionName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `smart-personal-world-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            toast({ title: 'نجاح', description: 'تم بدء تحميل نسخة احتياطية من بياناتك.' });
        } catch (error) {
            console.error("Export error:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تصدير البيانات.' });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleImport = () => {
        setIsImporting(true);
        toast({ title: 'قيد التطوير', description: 'ميزة استيراد البيانات ستتوفر قريباً.' });
        setTimeout(() => setIsImporting(false), 1500);
    };

    const handleExportAsImage = useCallback(async () => {
        if (!user || loadingTasks || loadingGoals || loadingHabits) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'البيانات لا تزال قيد التحميل.' });
            return;
        }
        setIsGeneratingImage(true);

        try {
            const summaryData = {
                userName: user.displayName || 'مستخدم',
                tasksCompleted: tasks?.filter(t => t.status === 'completed').length || 0,
                goalsCompleted: goals?.filter(g => g.progress === 100).length || 0,
                habitsAcquired: habits?.filter(h => h.type === 'acquire').length || 0,
            };

            const response = await generateSummaryImage(summaryData);
            
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = '600px';
            tempDiv.style.height = '400px';
            tempDiv.innerHTML = response.htmlContent;
            
            // Add Tailwind CSS link
            const tailwindLink = document.createElement('link');
            tailwindLink.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
            tailwindLink.rel = 'stylesheet';
            tempDiv.prepend(tailwindLink);


            document.body.appendChild(tempDiv);
            
            // Wait for styles and images to load
            await new Promise(resolve => setTimeout(resolve, 1000));


            const dataUrl = await toPng(tempDiv, { 
                quality: 0.95,
                pixelRatio: 2,
                style: {
                    fontFamily: 'Tajawal, sans-serif'
                }
             });

            const link = document.createElement('a');
            link.download = 'achievement-summary.png';
            link.href = dataUrl;
            link.click();
            
            document.body.removeChild(tempDiv);
            toast({ title: 'نجاح', description: 'تم إنشاء وتنزيل صورة الملخص.' });

        } catch (error: any) {
            console.error("Image generation error:", error);
            toast({ variant: 'destructive', title: 'خطأ في إنشاء الصورة', description: error.message || 'فشل الاتصال بالذكاء الاصطناعي.' });
        } finally {
            setIsGeneratingImage(false);
        }

    }, [user, tasks, goals, habits, loadingTasks, loadingGoals, loadingHabits, toast]);


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">تصدير واستيراد البيانات</h2>
      </div>
       <Card>
            <CardHeader>
                <CardTitle>النسخ الاحتياطي والاستعادة</CardTitle>
                <CardDescription>
                    قم بإدارة بياناتك عن طريق تصديرها كنسخة احتياطية أو استيرادها لاستعادة حالتها.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                 <div className="flex flex-col gap-2 p-6 border rounded-lg">
                    <div className="flex items-center gap-2">
                         <FileJson className="h-6 w-6 text-primary" />
                         <h3 className="text-lg font-semibold">تصدير البيانات</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        قم بتنزيل نسخة احتياطية كاملة من جميع بياناتك في التطبيق بصيغة JSON.
                    </p>
                    <Button onClick={handleExport} disabled={isExporting} className="mt-2 w-fit">
                        {isExporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
                        {isExporting ? 'جاري التصدير...' : 'تصدير بياناتي'}
                    </Button>
                </div>
                 <div className="flex flex-col gap-2 p-6 border rounded-lg">
                    <div className="flex items-center gap-2">
                         <Upload className="h-6 w-6 text-muted-foreground" />
                         <h3 className="text-lg font-semibold">استيراد البيانات</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        استعد بياناتك من ملف نسخة احتياطية. (ميزة قيد التطوير)
                    </p>
                    <Button onClick={handleImport} disabled={true} className="mt-2 w-fit">
                        {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
                        {isImporting ? 'جاري الاستيراد...' : 'استيراد بيانات'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">سيتم تفعيل هذه الميزة في التحديثات القادمة.</p>
                </div>
                <div className="md:col-span-2 flex flex-col gap-2 p-6 border rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                         <FileImage className="h-6 w-6 text-primary" />
                         <h3 className="text-lg font-semibold">تصدير كصورة</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        قم بتصدير ملخص بياناتك على هيئة صورة منظمة وسهلة للمشاركة.
                    </p>
                     <Button onClick={handleExportAsImage} disabled={isGeneratingImage || loadingTasks || loadingGoals || loadingHabits} className="mt-2 w-fit">
                        {isGeneratingImage ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
                        {isGeneratingImage ? 'جاري إنشاء الصورة...' : 'تصدير كصورة'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
