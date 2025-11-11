'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore }from '@/firebase';
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
import { cn } from '@/lib/utils';

// Helper function to convert HSL string "h s% l%" to a hex color
function hslStringToHex(hslStr: string): string {
  if (!hslStr) return '#000000';
  const [h, s, l] = hslStr.match(/\d+/g)?.map(Number) || [0, 0, 0];
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

// Helper function to convert hex color to an HSL string "h s% l%"
function hexToHslString(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
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
  const firestore = useFirestore();
  const { toast } = useToast();

  const [primaryColor, setPrimaryColor] = useState('0 0% 0%');
  const [backgroundColor, setBackgroundColor] = useState('0 0% 0%');
  const [accentColor, setAccentColor] = useState('0 0% 0%');
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
        const computedStyle = getComputedStyle(document.documentElement);
        setPrimaryColor(computedStyle.getPropertyValue('--primary').trim());
        setBackgroundColor(computedStyle.getPropertyValue('--background').trim());
        setAccentColor(computedStyle.getPropertyValue('--accent').trim());
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
        primaryColor,
        backgroundColor,
        accentColor
    };

    try {
      await setDoc(userDocRef, themeData, { merge: true });
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات المظهر بنجاح." });
    } catch (error) {
       console.error("Error saving theme:", error);
       const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: themeData
        });
        errorEmitter.emit('permission-error', permissionError);
        // We don't need a toast here because the global error handler will catch it.
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">الإعدادات</h2>
      <Card>
        <CardHeader>
          <CardTitle>تخصيص المظهر</CardTitle>
          <CardDescription>
            قم بتخصيص ألوان التطبيق لتناسب ذوقك. انقر على مربع اللون لاختيار لون جديد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                        <span className='font-mono text-sm text-muted-foreground'>{primaryColor}</span>
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
                         <span className='font-mono text-sm text-muted-foreground'>{backgroundColor}</span>
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
                         <span className='font-mono text-sm text-muted-foreground'>{accentColor}</span>
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
