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
  Coffee,
  Library,
  HandHeart,
  StickyNote,
  Clock,
  BookOpen,
  HeartPulse,
  Lightbulb,
  Archive,
  BookText,
  Swords
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname !== '/dashboard') return false;
    return pathname.startsWith(path)
  }
  
  const mainSections = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
    { name: 'التقويم', href: '/dashboard/calendar', icon: Calendar },
  ]
  
  const organizationSections = [
    { name: 'الأهداف', href: '/dashboard/goals', icon: Target },
    { name: 'المهام', href: '/dashboard/tasks', icon: ClipboardCheck },
    { name: 'العادات', href: '/dashboard/habits', icon: Repeat },
    { name: 'الملاحظات', href: '/dashboard/notes', icon: StickyNote },
    { name: 'الملفات', href: '/dashboard/files', icon: File },
    { name: 'الصندوق الشخصي', href: '/dashboard/personal-box', icon: Archive },
    { name: 'المذكرة', href: '/dashboard/journaling', icon: BookText },
  ];

  const selfDevelopmentSections = [
      { name: 'مرآة الذات', href: '/dashboard/mood', icon: Smile },
      { name: 'صندوق الامتنان', href: '/dashboard/gratitude', icon: Heart },
      { name: 'يومي الجميل', href: '/dashboard/beautiful-day', icon: Sparkles },
      { name: 'العبادات', href: '/dashboard/faith', icon: HandHeart },
      { name: 'الصحة والغذاء', href: '/dashboard/health', icon: HeartPulse },
      { name: 'الإلهامات', href: '/dashboard/inspirations', icon: Lightbulb },
  ];
  
  const toolsSections = [
      { name: 'الدورات التعليمية', href: '/dashboard/courses', icon: BookOpen },
      { name: 'مكتبتي المعرفية', href: '/dashboard/library', icon: Library },
      { name: 'وضع الإنتاج العميق', href: '/dashboard/focus', icon: Clock },
      { name: 'مخطط الترفيه', href: '/dashboard/relax', icon: Coffee },
  ];

  const analysisSections = [
    { name: 'التحليلات', href: '/dashboard/analytics', icon: BarChart },
    { name:... 