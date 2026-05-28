'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';
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
}

export default function Sidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'My Groups', href: '/groups', icon: Users },
    { 
      label: 'Assignments', 
      href: '/assignments', 
      icon: FileText
    },
    { label: "AI Teacher's Toolkit", href: '/toolkit', icon: Wrench },
    { label: 'My Library', href: '/library', icon: BookOpen },
  ];

  // Dynamic school card states
  const [instName, setInstName] = useState('St. Kabir High School');
  const [instSub, setInstSub] = useState('Mumbai, Maharashtra');
  const [instLogo, setInstLogo] = useState('');

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchInstitutionDetails = async () => {
    try {
      const res = await axios.get(`${apiURL}/api/users/me`);
      if (res.data && res.data.success && res.data.data.institution) {
        const inst = res.data.data.institution;
        if (inst.name) setInstName(inst.name);
        
        let sub = '';
        if (inst.city) sub += inst.city;
        if (inst.board) sub += sub ? `, ${inst.board}` : inst.board;
        if (!sub) sub = 'Mumbai, Maharashtra';

        setInstSub(sub);
        setInstLogo(inst.logoUrl || '');
      }
    } catch (err) {
      console.error('Sidebar institution loading failed:', err);
    }
  };

  useEffect(() => {
    fetchInstitutionDetails();
    
    // Listen to settings update triggers for zero-refresh updates
    window.addEventListener('institution-updated', fetchInstitutionDetails);
    return () => {
      window.removeEventListener('institution-updated', fetchInstitutionDetails);
    };
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-[264px] h-screen bg-white border-r border-border p-4 fixed left-0 top-0 select-none z-30 no-print">
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
          // Home route exact match, other routes prefix match
          const isActive = item.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.href);
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
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-4 pt-4 border-t border-border">
        {/* Settings nav item */}
        <Link href="/settings/profile">
          <div className={`flex items-center gap-[10px] h-10 px-3 rounded-md cursor-pointer transition-colors ${
            pathname.startsWith('/settings')
              ? 'bg-surface font-semibold text-brand' 
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          }`}>
            <Settings className={`w-5 h-5 ${pathname.startsWith('/settings') ? 'text-brand' : ''}`} />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </Link>

        {/* School profile card */}
        <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-lg p-[10px] border border-border">
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-semibold text-sm border border-brand/10 overflow-hidden shrink-0 relative">
            {instLogo ? (
              <img 
                src={instLogo.startsWith('/') ? `${apiURL}${instLogo}` : instLogo} 
                alt="School crest" 
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              instName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-semibold text-text-primary truncate" title={instName}>{instName}</h4>
            <p className="text-[11px] text-text-secondary truncate" title={instSub}>{instSub}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
