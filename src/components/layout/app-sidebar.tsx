'use client'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

const SidebarLink = React.memo(({ href, icon: Icon, name, isActive }: { href: string; icon: React.ElementType; name: string, isActive: boolean }) => (
  <Link
    href={href}
    className={cn(
      'flex items-center gap-3 rounded-md p-2 text-sm transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
    )}
  >
    <Icon className="h-5 w-5" />
    <span>{name}</span>
  </Link>
));
SidebarLink.displayName = 'SidebarLink';


export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  }
  
  const mainSections = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
    { name: 'التقويم', href: '/dashboard/calendar', icon: Calendar },
  ]
  
  const organizationSections = [
    { name: 'الأهداف', href: '/dashboard/goals', icon: Target },
    { name: 'المشاريع والمهام', href: '/dashboard/tasks', icon: ClipboardCheck },
    { name: 'العادات', href: '/dashboard/habits', icon: Repeat },
    { name: 'الملاحظات', href: '/dashboard/notes', icon: StickyNote },
    { name: 'الملفات الهامة', href: '/dashboard/files', icon: File },
    { name: 'الصندوق الشخصي', href: '/dashboard/personal-box', icon: Archive },
    { name: 'المذكرة الخارجية', href: '/dashboard/journaling', icon: BookText },
  ];

  const selfDevelopmentSections = [
      { name: 'مرآة الذات', href: '/dashboard/mood', icon: Smile },
      { name: 'صندوق الامتنان', href: '/dashboard/gratitude', icon: Heart },
      { name: 'يومي الجميل', href: '/dashboard/beautiful-day', icon: Sparkles },
      { name: 'العبادات', href: '/dashboard/faith', icon: HandHeart },
      { name: 'الصحة والغذاء', href: '/dashboard/health', icon: HeartPulse },
      { name: 'صندوق الإلهام', href: '/dashboard/inspirations', icon: Lightbulb },
  ];
  
  const toolsSections = [
      { name: 'الدورات التعليمية', href: '/dashboard/courses', icon: BookOpen },
      { name: 'مخطط الدراسة', href: '/dashboard/study-planner', icon: BookMarked },
      { name: 'مخطط الترفيه', href: '/dashboard/relax', icon: Wind },
      { name: 'مكتبتي المعرفية', href: '/dashboard/library', icon: Library },
      { name: 'وضع الإنتاج العميق', href: '/dashboard/focus', icon: Clock },
      { name: 'تحويشتي', href: '/dashboard/savings', icon: PiggyBank },
  ];

  const analysisSections = [
    { name: 'الإنجازات والتحديات', href: '/dashboard/challenges', icon: Trophy },
  ];

  const otherSections = [
    { name: 'رسائل لنفسي', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'الذكريات', href: '/dashboard/memories', icon: Camera },
    { name: 'الثيمات الديناميكية', href: '/dashboard/dynamic-themes', icon: Droplets },
  ];
  
  const settingsSection = { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings };


  const SidebarSection = ({ title, items }: { title: string, items: { name: string, href: string, icon: React.ElementType }[] }) => (
    <>
      <SidebarSeparator />
      <h2 className="px-2 py-1 text-xs font-semibold text-muted-foreground/80">{title}</h2>
      {items.map((item) => (
        <SidebarMenuItem key={item.name}>
          <SidebarLink href={item.href} icon={item.icon} name={item.name} isActive={isActive(item.href)} />
        </SidebarMenuItem>
      ))}
    </>
  )

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainSections.map((item) => (
             <SidebarMenuItem key={item.name}>
                <SidebarLink href={item.href} icon={item.icon} name={item.name} isActive={isActive(item.href)} />
            </SidebarMenuItem>
          ))}
          <SidebarSection title="التنظيم" items={organizationSections} />
          <SidebarSection title="تطوير الذات" items={selfDevelopmentSections} />
          <SidebarSection title="الأدوات" items={toolsSections} />
          <SidebarSection title="التحليل" items={analysisSections} />
          <SidebarSection title="أخرى" items={otherSections} />
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
               <SidebarLink href={settingsSection.href} icon={settingsSection.icon} name={settingsSection.name} isActive={isActive(settingsSection.href)} />
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
