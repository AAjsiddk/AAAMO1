'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [primaryColor, setPrimaryColor] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const computedStyle = getComputedStyle(document.documentElement);
        setPrimaryColor(computedStyle.getPropertyValue('--primary').trim());
        setBackgroundColor(computedStyle.getPropertyValue('--background').trim());
        setAccentColor(computedStyle.getPropertyValue('--accent').trim());
    }
  }, []);


  const handleColorChange = (colorSetter: React.Dispatch<React.SetStateAction<string>>, cssVar: string, value: string) => {
    colorSetter(value);
    document.documentElement.style.setProperty(cssVar, value);
  };
  
  const saveTheme = async () => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "خطأ", description: "المستخدم غير مسجل." });
        return;
    }
    setIsSaving(true);
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const themeData = {
        primaryColor,
        backgroundColor,
        accentColor
    };

    setDoc(userDocRef, themeData, { merge: true }).catch((error) => {
        console.error("Error saving theme:", error);
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: themeData
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ المظهر. قد تكون هناك مشكلة في الأذونات." });
    }).then(() => {
        if(!errorEmitter) {
           toast({ title: "تم الحفظ", description: "تم حفظ إعدادات المظهر بنجاح." });
        }
    }).finally(() => {
        setIsSaving(false);
    });
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">الإعدادات</h2>
      <Card>
        <CardHeader>
          <CardTitle>تخصيص المظهر</CardTitle>
          <CardDescription>
            قم بتخصيص ألوان التطبيق لتناسب ذوقك. الألوان تستخدم صيغة HSL (Hue, Saturation, Lightness).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                 <div className="space-y-2">
                    <Label htmlFor="primaryColor">اللون الأساسي (Primary)</Label>
                    <div className='flex items-center gap-2'>
                        <Input 
                            id="primaryColor" 
                            type="text" 
                            value={primaryColor}
                            onChange={(e) => handleColorChange(setPrimaryColor, '--primary', e.target.value)}
                            />
                        <div className='w-10 h-10 rounded-md border' style={{ backgroundColor: `hsl(${primaryColor})`}} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="backgroundColor">لون الخلفية (Background)</Label>
                     <div className='flex items-center gap-2'>
                        <Input 
                            id="backgroundColor" 
                            type="text" 
                            value={backgroundColor}
                            onChange={(e) => handleColorChange(setBackgroundColor, '--background', e.target.value)}
                        />
                        <div className='w-10 h-10 rounded-md border' style={{ backgroundColor: `hsl(${backgroundColor})`}} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="accentColor">اللون الثانوي (Accent)</Label>
                     <div className='flex items-center gap-2'>
                        <Input 
                            id="accentColor" 
                            type="text" 
                            value={accentColor}
                            onChange={(e) => handleColorChange(setAccentColor, '--accent', e.target.value)}
                        />
                        <div className='w-10 h-10 rounded-md border' style={{ backgroundColor: `hsl(${accentColor})`}} />
                    </div>
                </div>
            </div>
          <Button onClick={saveTheme} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
