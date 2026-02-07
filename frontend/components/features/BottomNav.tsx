'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, MessageCircle, User, Settings, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBadge } from '@/components/ui';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface BottomNavProps {
  unreadMessages?: number;
  newMatches?: number;
}

export function BottomNav({ unreadMessages = 0, newMatches = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: '/discover',
      icon: <Flame className="w-6 h-6" />,
      label: 'Discover',
    },
    {
      href: '/likes',
      icon: <Heart className="w-6 h-6" />,
      label: 'Likes',
      badge: newMatches,
    },
    {
      href: '/matches',
      icon: <MessageCircle className="w-6 h-6" />,
      label: 'Matches',
      badge: unreadMessages,
    },
    {
      href: '/profile',
      icon: <User className="w-6 h-6" />,
      label: 'Profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-dark-100 safe-bottom">
      <div className="max-w-lg mx-auto px-4">
        <ul className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center gap-1 py-3 px-4 transition-colors',
                    isActive
                      ? 'text-primary-500'
                      : 'text-dark-400 hover:text-dark-600'
                  )}
                >
                  <div className="relative">
                    {item.icon}
                    {item.badge !== undefined && item.badge > 0 && (
                      <NotificationBadge count={item.badge} />
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
