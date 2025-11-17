'use client'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
  BarChart,
  Settings,
  Calendar,
  Camera,
  MessageSquare,
  Sparkles,
  Smile,
  Heart,
  Trophy,
  Package,
  Droplets,
  TrendingUp,
  BrainCircuit,
  Coffee,
  Library,
  HandHeart,
  Clock,
  FolderKanban,
  StickyNote,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path;
    return pathname.startsWith(path)
  }
  
  const mainSections = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: <LayoutDashboard /> },
    { name: 'التقويم', href: '/dashboard/calendar', icon: <Calendar /> },
  ]
  
  const organizationSections = [
    { name: 'الأهداف', href: '/dashboard/goals', icon: <Target /> },
    { name: 'المشاريع', href: '/dashboard/projects', icon: <FolderKanban /> },
    { name: 'المهام', href: '/dashboard/tasks', icon: <ClipboardCheck /> },
    { name: 'العادات', href: '/dashboard/habits', icon: <Repeat /> },
    { name: 'الملاحظات', href: '/dashboard/notes', icon: <StickyNote /> },
    { name: 'الملفات', href: '/dashboard/files', icon: <File /> },
    { name: 'المذكرات', href: '/dashboard/journal', icon: <Camera /> },
  ];

  const selfDevelopmentSections = [
      { name: 'مرآة الذات', href: '/dashboard/mood', icon: <Smile /> },
      { name: 'صندوق الامتنان', href: '/dashboard/gratitude', icon: <Heart /> },
      { name: 'يومي الجميل', href: '/dashboard/beautiful-day', icon: <Sparkles /> },
      { name: 'ركن العبادات', href: '/dashboard/faith', icon: <HandHeart /> },
  ];
  
  const toolsSections = [
      { name: 'الذكاء المساعد', href: '/dashboard/ai-assistant', icon: <BrainCircuit /> },
      { name: 'مكتبتي المعرفية', href: '/dashboard/library', icon: <Library /> },
      { name: 'وضع التركيز', href: '/dashboard/focus', icon: <Clock /> },
      { name: 'مخطط الترفيه', href: '/dashboard/relax', icon: <Coffee /> },
  ];

  const analysisSections = [
    { name: 'التحليلات', href: '/dashboard/analytics', icon: <BarChart /> },
    { name: 'الإنجاز التراكمي', href: '/dashboard/cumulative-achievements', icon: <TrendingUp /> },
    { name: 'الإنجازات', href: '/dashboard/achievements', icon: <Trophy /> },
  ];

  const otherSections = [
    { name: 'الذكريات', href: '/dashboard/memories', icon: <Camera /> },
    { name: 'رسائل للمستقبل', href: '/dashboard/messages', icon: <MessageSquare /> },
    { name: 'الثيمات', href: '/dashboard/dynamic-themes', icon: <Droplets /> },
    { name: 'النسخ الاحتياطي', href: '/dashboard/data-sync', icon: <Package /> },
  ]
  
  const NavLink = ({ item, active }: { item: { href: string; name: string; icon: React.ReactNode }, active: boolean }) => (
    <Link href={item.href} className={cn(
        "flex items-center p-3 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors",
        active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
    )}>
        {item.icon}
        <span className="mr-4">{item.name}</span>
    </Link>
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <NavLink item={section} active={isActive(section.href!)} />
            </SidebarMenuItem>
          ))}
          <SidebarSeparator />
          {organizationSections.map((section) => (
            <SidebarMenuItem key={section.href}>
               <NavLink item={section} active={isActive(section.href!)} />
            </SidebarMenuItem>
          ))}
           <SidebarSeparator />
          {selfDevelopmentSections.map((section) => (
            <SidebarMenuItem key={section.href}>
               <NavLink item={section} active={isActive(section.href!)} />
            </SidebarMenuItem>
          ))}
           <SidebarSeparator />
           {toolsSections.map((section) => (
            <SidebarMenuItem key={section.href}>
               <NavLink item={section} active={isActive(section.href!)} />
            </SidebarMenuItem>
          ))}
           <SidebarSeparator />
           {analysisSections.map((section) => (
            <SidebarMenuItem key={section.href}>
               <NavLink item={section} active={isActive(section.href!)} />
            </SidebarMenuItem>
          ))}
           <SidebarSeparator />
          {otherSections.map((section) => (
            <SidebarMenuItem key={section.href}>
               <NavLink item={section} active={isActive(section.href!)} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <NavLink item={{name: "الإعدادات", href:"/dashboard/settings", icon: <Settings /> }} active={isActive('/dashboard/settings')} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
