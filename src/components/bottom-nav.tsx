'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, Bot, BarChart3, Target, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/contas', label: 'Contas', icon: Wallet },
  { href: '/contadora', label: 'Contadora', icon: Bot },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/backup', label: 'Backup', icon: Cloud },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 bg-card border-t shadow-t-lg">
      <div className="flex justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center text-center w-16 text-xs gap-1 transition-colors',
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
