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
  SidebarGroup,
  SidebarGroupLabel,
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
} from 'lucide-react'

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || (path !== '/dashboard' && pathname.startsWith(`${path}/`))
  }
  
  const mainSections = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: <LayoutDashboard /> },
    { name: 'التقويم', href: '/dashboard/calendar', icon: <Calendar /> },
  ]
  
  const organizationSections = [
    { name: 'الأهداف', href: '/dashboard/goals', icon: <Target /> },
    { name: 'المهام', href: '/dashboard/tasks', icon: <ClipboardCheck /> },
    { name: 'العادات', href: '/dashboard/habits', icon: <Repeat /> },
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

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup>
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
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>التنظيم</SidebarGroupLabel>
             {organizationSections.map((section) => (
              <SidebarMenuItem key={section.href}>
                <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                  <Link href={section.href!}>
                    {section.icon}
                    <span>{section.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
          
           <SidebarGroup>
            <SidebarGroupLabel>تطوير الذات</SidebarGroupLabel>
           {selfDevelopmentSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>الأدوات</SidebarGroupLabel>
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
          </SidebarGroup>

           <SidebarGroup>
            <SidebarGroupLabel>التحليل والتقدم</SidebarGroupLabel>
            {analysisSections.map((section) => (
            <SidebarMenuItem key={section.href}>
              <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                <Link href={section.href!}>
                  {section.icon}
                  <span>{section.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          </SidebarGroup>
          
          <SidebarGroup>
            <SidebarGroupLabel>أقسام أخرى</SidebarGroupLabel>
            {otherSections.map((section) => (
              <SidebarMenuItem key={section.href}>
                <SidebarMenuButton asChild isActive={isActive(section.href!)} tooltip={section.name}>
                  <Link href={section.href!}>
                    {section.icon}
                    <span>{section.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
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
