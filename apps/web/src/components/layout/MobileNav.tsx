'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, BookOpen, Wrench } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const items = [
    { label: 'Home', href: '#', icon: Home },
    { label: 'Assignments', href: '/assignments', icon: FileText },
    { label: 'Library', href: '#', icon: BookOpen },
    { label: 'AI Toolkit', href: '#', icon: Wrench },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around px-2 z-30 select-none no-print">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href) && item.href !== '#';
        const Icon = item.icon;

        return (
          <Link key={item.label} href={item.href} className="flex-1 max-w-[80px]">
            <div className="flex flex-col items-center justify-center gap-0.5 cursor-pointer">
              <Icon 
                className={`w-5 h-5 ${
                  isActive ? 'text-brand' : 'text-text-secondary'
                }`} 
              />
              <span 
                className={`text-[10px] font-medium tracking-tight truncate w-full text-center ${
                  isActive ? 'text-brand font-semibold' : 'text-text-secondary'
                }`}
              >
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
