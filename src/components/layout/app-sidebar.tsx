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
  Swords,
  BrainCircuit,
  PiggyBank,
  BookMarked
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    // Exact match for dashboard, partial for others
    return path === '/dashboard' ? pathname === path : pathname.startsWith(path);
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
      { name: 'مخطط الدراسة', href: '/dashboard/study-planner', icon: BookMarked },
      { name: 'مكتبتي المعرفية', href: '/dashboard/library', icon: Library },
      { name: 'وضع الإنتاج العميق', href: '/dashboard/focus', icon: Clock },
      { name: 'مخطط الترفيه', href: '/dashboard/relax', icon: Coffee },
      { name: 'تحويشتي', href: '/dashboard/savings', icon: PiggyBank },
  ];

  const analysisSections = [
    { name: 'التحليلات', href: '/dashboard/analytics', icon: BarChart },
    { name: 'الإنجاز التراكمي', href: '/dashboard/cumulative-achievements', icon: TrendingUp },
    { name: 'التحديات', href: '/dashboard/challenges', icon: Trophy },
  ];

  const otherSections = [
    { name: 'رسائل لنفسي', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'الذكريات', href: '/dashboard/memories', icon: Camera },
    { name: 'الثيمات الديناميكية', href: '/dashboard/dynamic-themes', icon: Droplets },
    { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
  ];

  const SidebarSection = ({ title, items }: { title: string, items: { name: string, href: string, icon: React.ElementType }[] }) => (
    <>
      <SidebarSeparator />
      <h2 className="px-2 py-1 text-xs font-semibold text-muted-foreground/80">{title}</h2>
      {items.map((item) => (
        <SidebarMenuItem key={item.name}>
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md p-2 text-sm transition-colors',
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
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
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md p-2 text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuItem>
          ))}
          <SidebarSection title="التنظيم" items={organizationSections} />
          <SidebarSection title="تطوير الذات" items={selfDevelopmentSections} />
          <SidebarSection title="الأدوات" items={toolsSections} />
          <SidebarSection title="التحليل" items={analysisSections} />
          <SidebarSection title="أخرى" items={otherSections} />
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
