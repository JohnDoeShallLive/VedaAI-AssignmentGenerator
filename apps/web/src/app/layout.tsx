import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import AppLayoutWrapper from '@/components/layout/AppLayoutWrapper';
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
        <AuthProvider>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
