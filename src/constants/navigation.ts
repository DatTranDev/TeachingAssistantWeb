import { BookOpen, Bell, Calendar, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TKey } from '@/hooks/use-t';

export interface NavItem {
  labelKey: TKey;
  href: string;
  icon: LucideIcon;
  showBadge?: boolean;
}

export const teacherNavItems: NavItem[] = [
  { labelKey: 'nav.timetable', href: '/teacher/timetable', icon: Calendar },
  { labelKey: 'nav.classes', href: '/teacher/classes', icon: BookOpen },
  { labelKey: 'nav.notifications', href: '/teacher/notifications', icon: Bell, showBadge: true },
  { labelKey: 'nav.aiAssistant', href: '/teacher/ai-assistant', icon: Sparkles },
];

export const studentNavItems: NavItem[] = [
  { labelKey: 'nav.timetable', href: '/student/timetable', icon: Calendar },
  { labelKey: 'nav.classes', href: '/student/classes', icon: BookOpen },
  { labelKey: 'nav.notifications', href: '/student/notifications', icon: Bell, showBadge: true },
  { labelKey: 'nav.aiAssistant', href: '/student/ai-assistant', icon: Sparkles },
];
