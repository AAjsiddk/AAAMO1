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
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  ClipboardCheck,
  Book,
  File,
  Target,
  Repeat,
  BarChart,
  Settings,
  FolderKanban,
  Calendar,
  Users,
  Camera,
  MessageSquare,
  Sparkles,
  Smile,
  BookOpen,
  Clock,
  Heart,
  ShieldCheck,
  Trophy,
  Package,
  Droplets,
  TrendingUp,
  BrainCircuit,
  Coffee,
  Library,
  HandHeart,
} from 'lucide-react'

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || (path !== '/dashboard' && pathname.startsWith(`${path}/`))
  }

  const mainSections = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: <LayoutDashboard /> },
    { name: 'التقويم المتكامل', href: '/dashboard/calendar', icon: <Calendar /> },
  ]
  
  const coreSections = [
    { name: 'الأهداف', href: '/dashboard/goals', icon: <Target /> },
    { name: 'المهام', href: '/dashboard/tasks', icon: <ClipboardCheck /> },
    { name: 'العادات', href: '/dashboard/habits', icon: <Repeat /> },
    { name: 'الملفات', href: '/dashboard/files', icon: <File /> },
    { name: 'المذكرات', href: '/dashboard/journal', icon: <Book /> },
  ];

  const advancedSections = [
    { name: 'المشاريع الطويلة', href: '/dashboard/projects', icon: <FolderKanban /> },
    { name: 'التحليلات العامة', href: '/dashboard/analytics', icon: <BarChart /> },
    { name: 'الإنجاز التراكمي', href: '/dashboard/cumulative-achievements', icon: <TrendingUp /> },
  ];

  const selfReflectionSections = [
      { name: 'مرآة الذات', href: '/dashboard/mood', icon: <Smile /> },
      { name: 'الذكريات', href: '/dashboard/memories', icon: <Camera /> },
      { name: 'رسائل لنفسي', href: '/dashboard/messages', icon: <MessageSquare /> },
      { name: 'صندوق الامتنان', href: '/dashboard/gratitude', icon: <Heart /> },
      { name: 'يومي الجميل', href: '/dashboard/beautiful-day', icon: <Sparkles /> },
  ];
  
  const toolsSections = [
      { name: 'الذكاء المساعد', href: '/dashboard/ai-assistant', icon: <BrainCircuit /> },
      { name: 'مكتبتي المعرفية', href: '/dashboard/library', icon: <Library /> },
      { name: 'وضع الإنتاج العميق', href: '/dashboard/focus', icon: <Clock /> },
      { name: 'مخطط الترفيه', href: '/dashboard/relax', icon: <Coffee /> },
      { name: 'تصدير واستيراد', href: '/dashboard/data-sync', icon: <Package /> },
  ];

  const spiritualSection = [
      { name: 'ركن العبادات', href: '/dashboard/faith', icon: <HandHeart /> },
  ]
  
  const otherAdvancedSections = [
    { name: 'الثيمات الديناميكية', href: '/dashboard/dynamic-themes', icon: <Droplets /> },
    { name: 'الإنجازات والتحديات', href: '/dashboard/achievements', icon: <Trophy /> },
  ];


  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarSeparator className="my-1" />
           {coreSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
           <SidebarSeparator className="my-1" />
           {advancedSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarSeparator className="my-1" />
          {selfReflectionSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarSeparator className="my-1" />
          {toolsSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
           <SidebarSeparator className="my-1" />
          {otherAdvancedSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarSeparator className="my-1" />
          {spiritualSection.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/settings')}
              tooltip="الإعدادات"
            >
              <Link href="/dashboard/settings">
                <Settings />
                <span>الإعدادات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
