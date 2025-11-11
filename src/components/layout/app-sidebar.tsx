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
  PlusCircle,
  Package,
  Droplets,
  TrendingUp,
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
    { name: 'الإنجازات والتحديات', href: '/dashboard/achievements', icon: <Trophy /> },
  ];

  const selfReflectionSections = [
      { name: 'مرآة الذات', href: '/dashboard/mood', icon: <Smile /> },
      { name: 'الذكريات', href: '/dashboard/memories', icon: <Camera /> },
      { name: 'رسائل لنفسي', href: '/dashboard/messages', icon: <MessageSquare /> },
      { name: 'صندوق الامتنان', href: '/dashboard/gratitude', icon: <Heart /> },
      { name: 'يومي الجميل', href: '/dashboard/beautiful-day', icon: <Sparkles /> },
  ];
  
  const toolsSections = [
      { name: 'الذكاء المساعد', href: '/dashboard/ai-assistant', icon: <Sparkles /> },
      { name: 'مكتبة التطوير', href: '/dashboard/library', icon: <BookOpen /> },
      { name: 'وضع الإنتاج العميق', href: '/dashboard/focus', icon: <Clock /> },
      { name: 'زاوية الراحة', href: '/dashboard/relax', icon: <Users /> },
      { name: 'تصدير واستيراد', href: '/dashboard/data-sync', icon: <Package /> },
  ];

  const spiritualSection = [
      { name: 'قسم الإيمان', href: '/dashboard/faith', icon: <ShieldCheck /> },
  ]
  
  const otherAdvancedSections = [
    { name: 'الثيمات الديناميكية', href: '/dashboard/dynamic-themes', icon: <Droplets /> },
    { name: 'الإنجاز التراكمي', href: '/dashboard/cumulative-achievements', icon: <TrendingUp /> },
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
            <Button variant="outline" className="w-full justify-start">
               <PlusCircle className="ml-2" />
               <span>إضافة قسم جديد</span>
            </Button>
           </SidebarMenuItem>
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
