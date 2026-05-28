'use client';

import { usePathname } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

// Configure Axios globally to pass cookies to Express in CORS/Multi-port environments
axios.defaults.withCredentials = true;

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Exclude sidebar/header/nav on auth and onboarding routes
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/onboarding');

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {children}
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Persistent Sidebar on Desktop */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-surface">
        {/* Top Fixed Header */}
        <Header />

        {/* Content Canvas */}
        <main className="flex-1 pt-16 pb-16 lg:pb-0 lg:pl-[264px]">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Bottom Nav on Mobile */}
        <MobileNav />
      </div>
    </div>
  );
}
