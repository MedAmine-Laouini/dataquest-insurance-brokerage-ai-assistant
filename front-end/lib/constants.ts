import {
  LayoutDashboard,
  Users,
  FileText,
  Layers,
  CheckSquare,
  Settings,
  Lock,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  icon: LucideIcon
  href: string
  badge?: string
  disabled?: boolean
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

export const navigationItems: NavSection[] = [
  {
    label: 'MAIN',
    items: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
      },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      {
        title: 'Clients',
        icon: Users,
        href: '/dashboard/clients',
      },
      {
        title: 'Policies',
        icon: FileText,
        href: '/dashboard/policies',
      },
    ],
  },
  {
    label: 'AI & OPERATIONS',
    items: [
      {
        title: 'AI Classification',
        icon: Layers,
        href: '/dashboard/ai-classification',
        badge: 'ML',
      },
      {
        title: 'Work Tracker',
        icon: CheckSquare,
        href: '/dashboard/work-tracker',
      },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      {
        title: 'Admin',
        icon: Lock,
        href: '/dashboard/admin',
      },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      {
        title: 'Settings',
        icon: Settings,
        href: '/dashboard/settings',
      },
    ],
  },
]

export const colors = {
  // Brand colors
  primary: '#3B82F6', // Electric Blue
  accent: '#8B5CF6', // Purple
  
  // Neutrals
  dark: '#0F172A', // Very dark blue
  slate: '#1E293B', // Slate
  muted: '#64748B', // Muted slate
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  // Semantic
  background: '#0F172A',
  foreground: '#F1F5F9',
  card: '#1E293B',
}
