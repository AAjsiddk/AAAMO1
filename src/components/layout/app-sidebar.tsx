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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import React, { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useUser, useFirestore } from '@/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

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

const initialSections = {
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

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const firestore = useFirestore()
  const [orderedSections, setOrderedSections] = useState(initialSections.organization);

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().sidebarOrder) {
          const savedOrder = docSnap.data().sidebarOrder as string[];
          const allSections = [...initialSections.organization, ...initialSections.selfDevelopment, ...initialSections.tools, ...initialSections.analysis, ...initialSections.other];
          const sectionMap = new Map(allSections.map(item => [item.href, item]));
          const newOrderedSections = savedOrder.map(href => sectionMap.get(href)).filter(Boolean) as typeof orderedSections;

          // Add any new sections that were not in the saved order
          allSections.forEach(section => {
            if (!newOrderedSections.find(s => s.href === section.href)) {
              newOrderedSections.push(section);
            }
          });
          
          setOrderedSections(newOrderedSections);
        } else {
            // Default order if nothing is saved
            setOrderedSections([
                ...initialSections.organization,
                ...initialSections.selfDevelopment,
                ...initialSections.tools,
                ...initialSections.analysis,
                ...initialSections.other,
            ]);
        }
      });
    }
  }, [user, firestore]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const items = Array.from(orderedSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedSections(items);
    
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const newOrderHrefs = items.map(item => item.href);
      updateDoc(userDocRef, { sidebarOrder: newOrderHrefs });
    }
  };

  const isActive = useCallback((path: string) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  }, [pathname]);

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
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="sidebar-sections">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef} className="flex w-full min-w-0 flex-col gap-1">
                {orderedSections.map((item, index) => (
                  <Draggable key={item.href} draggableId={item.href} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2"
                      >
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
