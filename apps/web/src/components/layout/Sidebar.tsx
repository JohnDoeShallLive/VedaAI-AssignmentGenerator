'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  FileText, 
  Wrench, 
  BookOpen, 
  Settings, 
  Plus 
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function Sidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: 'Home', href: '#', icon: Home },
    { label: 'My Groups', href: '#', icon: Users },
    { 
      label: 'Assignments', 
      href: '/assignments', 
      icon: FileText,
      badge: 3 // mock unread count from specs
    },
    { label: "AI Teacher's Toolkit", href: '#', icon: Wrench },
    { label: 'My Library', href: '#', icon: BookOpen },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[264px] h-screen bg-white border-r border-border p-4 fixed left-0 top-0 select-none z-30">
      {/* Logo Area */}
      <div className="flex items-center gap-2 mb-6 px-2">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-lg">
          V
        </div>
        <span className="font-semibold text-lg text-text-primary tracking-tight">VedaAI</span>
      </div>

      {/* Create Assignment CTA Button */}
      <Link href="/create" className="block mb-6">
        <button className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#333333] active:scale-[0.97] transition-all text-white font-medium py-[10px] px-5 rounded-full text-sm shadow-sm">
          <Plus className="w-4 h-4 text-white" />
          <span>Create Assignment</span>
        </button>
      </Link>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== '#';
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.href}>
              <div
                className={`flex items-center justify-between h-10 px-3 rounded-md transition-colors cursor-pointer group ${
                  isActive 
                    ? 'bg-surface font-semibold text-brand' 
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-[10px]">
                  <Icon 
                    className={`w-5 h-5 ${
                      isActive 
                        ? 'text-brand' 
                        : 'text-text-secondary group-hover:text-text-primary'
                    }`} 
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-4 pt-4 border-t border-border">
        {/* Settings nav item */}
        <Link href="#">
          <div className="flex items-center gap-[10px] h-10 px-3 rounded-md text-text-secondary hover:bg-surface hover:text-text-primary cursor-pointer">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </Link>

        {/* School profile card */}
        <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-lg p-[10px] border border-border">
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-semibold text-sm border border-brand/10">
            SK
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-semibold text-text-primary truncate">St. Kabir High School</h4>
            <p className="text-[11px] text-text-secondary truncate">Mumbai, Maharashtra</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
