'use client'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
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
} from 'lucide-react'

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard')}
              tooltip="لوحة التحكم"
            >
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>لوحة التحكم</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/journal')}
              tooltip="المذكرات"
            >
              <Link href="/dashboard/journal">
                <Book />
                <span>المذكرات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/tasks')}
              tooltip="المهام"
            >
              <Link href="/dashboard/tasks">
                <ClipboardCheck />
                <span>المهام</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/goals')}
              tooltip="الأهداف"
            >
              <Link href="/dashboard/goals">
                <Target />
                <span>الأهداف</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/habits')}
              tooltip="العادات"
            >
              <Link href="/dashboard/habits">
                <Repeat />
                <span>العادات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/projects')}
              tooltip="المشاريع الطويلة"
            >
              <Link href="/dashboard/projects">
                <FolderKanban />
                <span>المشاريع</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/files')}
              tooltip="الملفات"
            >
              <Link href="/dashboard/files">
                <File />
                <span>الملفات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard/analytics')}
              tooltip="التحليلات"
            >
              <Link href="/dashboard/analytics">
                <BarChart />
                <span>التحليلات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
