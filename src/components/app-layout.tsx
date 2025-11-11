'use client';
import type { ReactNode } from 'react';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-grow overflow-y-auto bg-background">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
