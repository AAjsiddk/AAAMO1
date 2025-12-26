'use client'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/logo'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  ClipboardCheck,
  File,
  Target,
  Repeat,
  Settings,
  Calendar,
  Camera,
  MessageSquare,
  Sparkles,
  Smile,
  Heart,
  Trophy,
  Droplets,
  Library,
  HandHeart,
  StickyNote,
  Clock,
  BookOpen,
  HeartPulse,
  Lightbulb,
  Archive,
  BookText,
  PiggyBank,
  BookMarked,
  Wind,
  GripVertical,
  Pin,
  PinOff,
  HandMetal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useUser, useFirestore, useFirebaseServices } from '@/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import type { UserSettings } from '@/lib/types'

type SidebarItem = { name: string; href: string; icon: React.ElementType; isPinned?: boolean; };
type SidebarSection = SidebarItem[];

const SidebarLink = React.memo(({ href, icon: Icon, name, isActive }: { href: string; icon: React.ElementType; name: string, isActive: boolean }) => {
  const { isMobile, setIsOpen } = useSidebar();
  const handleClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 rounded-md p-2 text-sm transition-colors w-full',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground/70 hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{name}</span>
    </Link>
  )
});
SidebarLink.displayName = 'SidebarLink';

const initialSections: { [key: string]: SidebarSection } = {
  main: [{ name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard }],
  organization: [
    { name: 'التقويم', href: '/dashboard/calendar', icon: Calendar },
    { name: 'الأهداف', href: '/dashboard/goals', icon: Target },
    { name: 'المشاريع والمهام', href: '/dashboard/tasks', icon: ClipboardCheck },
    { name: 'العادات', href: '/dashboard/habits', icon: Repeat },
    { name: 'الملاحظات', href: '/dashboard/notes', icon: StickyNote },
    { name: 'الملفات الهامة', href: '/dashboard/files', icon: File },
    { name: 'الصندوق الشخصي', href: '/dashboard/personal-box', icon: Archive },
    { name: 'المذكرة الخارجية', href: '/dashboard/journaling', icon: BookText },
  ],
  selfDevelopment: [
      { name: 'مرآة الذات', href: '/dashboard/mood', icon: Smile },
      { name: 'صندوق الامتنان', href: '/dashboard/gratitude', icon: Heart },
      { name: 'يومي الجميل', href: '/dashboard/beautiful-day', icon: Sparkles },
      { name: 'العبادات', href: '/dashboard/faith', icon: HandHeart },
      { name: 'السبحة الإلكترونية', href: '/dashboard/tasbeeh', icon: HandMetal },
      { name: 'الصحة والغذاء', href: '/dashboard/health', icon: HeartPulse },
      { name: 'صندوق الإلهام', href: '/dashboard/inspirations', icon: Lightbulb },
  ],
  tools: [
      { name: 'الدورات التعليمية', href: '/dashboard/courses', icon: BookOpen },
      { name: 'مخطط الدراسة', href: '/dashboard/study-planner', icon: BookMarked },
      { name: 'مخطط الترفيه', href: '/dashboard/relax', icon: Wind },
      { name: 'مكتبتي المعرفية', href: '/dashboard/library', icon: Library },
      { name: 'وضع الإنتاج العميق', href: '/dashboard/focus', icon: Clock },
      { name: 'تحويشتي', href: '/dashboard/savings', icon: PiggyBank },
  ],
  analysis: [
    { name: 'الإنجازات والتحديات', href: '/dashboard/challenges', icon: Trophy },
  ],
  other: [
    { name: 'رسائل لنفسي', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'الذكريات', href: '/dashboard/memories', icon: Camera },
    { name: 'الثيمات الديناميكية', href: '/dashboard/dynamic-themes', icon: Droplets },
  ],
  settings: [{ name: 'الإعدادات', href: '/dashboard/settings', icon: Settings }],
};

const ALL_SECTIONS = [
  ...initialSections.organization,
  ...initialSections.selfDevelopment,
  ...initialSections.tools,
  ...initialSections.analysis,
  ...initialSections.other,
];
const ALL_SECTIONS_MAP = new Map(ALL_SECTIONS.map(item => [item.href, item]));

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const firestore = useFirestore()
  const { userSettings, setUserSettings } = useFirebaseServices();
  const [orderedSections, setOrderedSections] = useState<SidebarSection>(ALL_SECTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userSettings) {
        const savedOrder = userSettings.sidebarOrder || [];
        const savedPinned = userSettings.pinnedItems || [];
        
        const newOrderedSections: SidebarItem[] = savedOrder.map(href => {
            const item = ALL_SECTIONS_MAP.get(href);
            return item ? { ...item, isPinned: savedPinned.includes(href) } : null;
        }).filter((item): item is SidebarItem => item !== null);
        
        ALL_SECTIONS.forEach(section => {
            if (!newOrderedSections.find(s => s.href === section.href)) {
                newOrderedSections.push({ ...section, isPinned: savedPinned.includes(section.href) });
            }
        });
        
        setOrderedSections(newOrderedSections);
        setIsLoading(false);
    }
  }, [userSettings]);

  const updateFirestoreSettings = (settings: Partial<UserSettings>) => {
    if (user && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        updateDoc(userDocRef, settings);
    }
    setUserSettings(prev => prev ? ({...prev, ...settings}) : null);
  };
  
  const handleTogglePin = (href: string) => {
    const newOrderedSections = orderedSections.map(s => s.href === href ? { ...s, isPinned: !s.isPinned } : s);
    setOrderedSections(newOrderedSections);
    
    const pinnedHrefs = newOrderedSections.filter(s => s.isPinned).map(s => s.href);
    updateFirestoreSettings({ pinnedItems: pinnedHrefs });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const items = Array.from(orderedSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedSections(items);
    updateFirestoreSettings({ sidebarOrder: items.map(item => item.href) });
  };

  const isActive = useCallback((path: string) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  }, [pathname]);
  
  const { pinned, unpinned } = useMemo(() => {
      const p = orderedSections.filter(item => item.isPinned);
      const u = orderedSections.filter(item => !item.isPinned);
      return { pinned: p, unpinned: u };
  }, [orderedSections]);


  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {initialSections.main.map((item) => (
             <SidebarMenuItem key={item.name}>
                <SidebarLink href={item.href} icon={item.icon} name={item.name} isActive={isActive(item.href)} />
            </SidebarMenuItem>
          ))}
          <SidebarSeparator />
        </SidebarMenu>
        
        {pinned.length > 0 && (
            <>
                <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">المثبتة</div>
                 <ul className="flex w-full min-w-0 flex-col gap-1 mt-2">
                    {pinned.map(item => (
                        <li key={item.href} className="flex items-center gap-2">
                            <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => handleTogglePin(item.href)}>
                                <PinOff className="h-4 w-4 text-primary" />
                            </button>
                             <SidebarLink href={item.href} icon={item.icon} name={item.name} isActive={isActive(item.href)} />
                        </li>
                    ))}
                </ul>
                <SidebarSeparator />
            </>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="sidebar-sections">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef} className="flex w-full min-w-0 flex-col gap-1">
                {unpinned.map((item, index) => (
                  <Draggable key={item.href} draggableId={item.href} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2"
                      >
                         <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => handleTogglePin(item.href)}>
                            <Pin className="h-4 w-4" />
                        </button>
                        <div {...provided.dragHandleProps} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
                            <GripVertical className="h-5 w-5" />
                        </div>
                        <SidebarLink href={item.href} icon={item.icon} name={item.name} isActive={isActive(item.href)} />
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </SidebarContent>
       <SidebarFooter>
        <SidebarMenu>
          {initialSections.settings.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarLink href={item.href} icon={item.icon} name={item.name} isActive={isActive(item.href)} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
