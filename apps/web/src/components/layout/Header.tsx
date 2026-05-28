'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Bell, ArrowLeft, ChevronDown } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  // Determine back navigation and page title
  let showBack = false;
  let title = 'Home';

  if (pathname.startsWith('/assignments')) {
    title = 'Assignments';
    if (pathname.includes('/result')) {
      showBack = true;
      title = 'Assignment Result';
    }
  } else if (pathname === '/create') {
    showBack = true;
    title = 'Create Assignment';
  }

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-[264px] z-20 select-none no-print">
      {/* Left side: Back button & Title */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-surface rounded-full transition-colors active:scale-95"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
        )}
        <h1 className="text-base font-semibold text-text-primary lg:text-lg">
          {title}
        </h1>
      </div>

      {/* Right side: Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="p-2 hover:bg-surface rounded-full transition-colors relative" aria-label="Notifications">
          <Bell className="w-5 h-5 text-text-secondary hover:text-text-primary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand"></span>
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-border"></div>

        {/* User Menu dropdown */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
            TS
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[13px] font-semibold text-text-primary leading-tight">Teacher Shreyash</p>
            <p className="text-[11px] text-text-secondary leading-none">Class Teacher</p>
          </div>
          <ChevronDown className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-transform group-hover:translate-y-0.5" />
        </div>
      </div>
    </header>
  );
}
