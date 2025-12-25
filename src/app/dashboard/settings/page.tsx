'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useFirestore, useAuth }from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
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
import { Loader2, Palette, Lock, Moon, Sun } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Helper function to convert HSL string "h s% l%" to a hex color
function hslStringToHex(hslStr: string): string {
  if (!hslStr) return '#000000';
  const [h, s, l] = hslStr.match(/(\d+(\.\d+)?)/g)?.map(Number) || [0, 0, 0];
  const saturation = s / 100;
  const lightness = l / 100;
  
  const a = saturation * Math.min(lightness, 1 - lightness);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper function to convert hex color to an HSL string "h s l"
function hexToHslString(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}


export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [primaryColor, setPrimaryColor] = useState('0 0% 0%');
  const [backgroundColor, setBackgroundColor] = useState('0 0% 0%');
  const [accentColor, setAccentColor] = useState('0 0% 0%');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
        const computedStyle = getComputedStyle(document.documentElement);
        setPrimaryColor(computedStyle.getPropertyValue('--primary').trim());
        setBackgroundColor(computedStyle.getPropertyValue('--background').trim());
        setAccentColor(computedStyle.getPropertyValue('--accent').trim());
        
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (storedTheme) {
            setThemeMode(storedTheme);
        } else {
             setThemeMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
    }
  }, []);

  const handleColorChange = useCallback((colorSetter: React.Dispatch<React.SetStateAction<string>>, cssVar: string, hexValue: string) => {
    const hslValue = hexToHslString(hexValue);
    colorSetter(hslValue);
    document.documentElement.style.setProperty(cssVar, hslValue);
  }, []);
  
  const saveTheme = async () => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "خطأ", description: "المستخدم غير مسجل." });
        return;
    }
    setIsSaving(true);
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const themeData = {
        theme: {
            primary: primaryColor,
            background: backgroundColor,
            accent: accentColor,
        },
        themeMode: themeMode,
    };

    try {
      await updateDoc(userDocRef, themeData);
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات المظهر بنجاح." });
    } catch (error) {
       console.error("Error saving theme:", error);
       const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: themeData
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSaving(false);
    }
  }

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    }
  }


  const handleAccountUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !auth) return;
      
      setIsSaving(true);
      try {
          if (newPassword) {
              if(!currentPassword) {
                  toast({ variant: "destructive", title: "خطأ", description: "يجب إدخال كلمة المرور الحالية لتغييرها." });
                  setIsSaving(false);
                  return;
              }
              if (user.email) {
                  const credential = EmailAuthProvider.credential(user.email, currentPassword);
                  await reauthenticateWithCredential(user, credential);
                  await updatePassword(user, newPassword);
                  toast({ title: "نجاح", description: "تم تحديث كلمة المرور بنجاح." });
                  setCurrentPassword('');
                  setNewPassword('');
              }
          }
      } catch (error: any) {
          console.error("Password update error:", error);
           let desc = "فشل تحديث كلمة المرور.";
          if (error.code === 'auth/wrong-password') {
            desc = "كلمة المرور الحالية غير صحيحة.";
          }
          toast({ variant: "destructive", title: "خطأ", description: desc });
      } finally {
        setIsSaving(false);
      }
  }
  
  if (!isMounted) {
      return (
         <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        </div>
      );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">الإعدادات</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette/> تخصيص المظهر</CardTitle>
          <CardDescription>
            قم بتخصيص ألوان التطبيق لتناسب ذوقك. انقر على مربع اللون لاختيار لون جديد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center space-x-2 space-x-reverse">
                <Button onClick={toggleTheme} variant="outline" size="icon">
                     {themeMode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                 <Label>{themeMode === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}</Label>
            </div>
             <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                 <div className="space-y-2">
                    <Label htmlFor="primaryColor">اللون الأساسي (Primary)</Label>
                    <div className='flex items-center gap-2'>
                        <Input 
                            id="primaryColor" 
                            type="color"
                            className='p-0 h-10 w-16 cursor-pointer'
                            value={hslStringToHex(primaryColor)}
                            onChange={(e) => handleColorChange(setPrimaryColor, '--primary', e.target.value)}
                            />
                        <Input 
                            className="font-mono text-sm"
                            value={primaryColor}
                            onChange={(e) => {
                                setPrimaryColor(e.target.value);
                                document.documentElement.style.setProperty('--primary', e.target.value);
                            }}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="backgroundColor">لون الخلفية (Background)</Label>
                     <div className='flex items-center gap-2'>
                        <Input 
                            id="backgroundColor" 
                            type="color" 
                            className='p-0 h-10 w-16 cursor-pointer'
                            value={hslStringToHex(backgroundColor)}
                            onChange={(e) => handleColorChange(setBackgroundColor, '--background', e.target.value)}
                        />
                         <Input 
                            className="font-mono text-sm"
                            value={backgroundColor}
                            onChange={(e) => {
                                setBackgroundColor(e.target.value);
                                document.documentElement.style.setProperty('--background', e.target.value);
                            }}
                        />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="accentColor">اللون الثانوي (Accent)</Label>
                     <div className='flex items-center gap-2'>
                        <Input 
                            id="accentColor" 
                            type="color" 
                            className='p-0 h-10 w-16 cursor-pointer'
                            value={hslStringToHex(accentColor)}
                            onChange={(e) => handleColorChange(setAccentColor, '--accent', e.target.value)}
                        />
                         <Input 
                            className="font-mono text-sm"
                            value={accentColor}
                            onChange={(e) => {
                                setAccentColor(e.target.value);
                                document.documentElement.style.setProperty('--accent', e.target.value);
                            }}
                         />
                    </div>
                </div>
            </div>
          <Button onClick={saveTheme} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            حفظ تغييرات المظهر
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock /> إعدادات الأمان</CardTitle>
          <CardDescription>
            قم بتحديث كلمة المرور الخاصة بحسابك.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleAccountUpdate} className="space-y-4 max-w-sm">
                 <div className="space-y-2">
                    <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                    <Input 
                        id="currentPassword" 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الحالية"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <Input 
                        id="newPassword" 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة"
                    />
                </div>
                 <Button type="submit" disabled={isSaving || !newPassword}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    تحديث كلمة المرور
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}

    