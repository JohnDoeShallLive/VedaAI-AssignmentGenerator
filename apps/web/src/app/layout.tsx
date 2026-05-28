import type { Metadata } from 'next';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'VedaAI — AI Assessment Creator',
  description: 'Generate structured, curriculum-aligned question papers in minutes with VedaAI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface font-sans text-text-primary antialiased min-h-screen">
        {/* Core Layout Structure */}
        <div className="flex">
          {/* Persistent Sidebar on Desktop */}
          <Sidebar />

          {/* Main Area */}
          <div className="flex-1 min-w-0 flex flex-col min-h-screen">
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
      </body>
    </html>
  );
}
