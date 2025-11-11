import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/contexts/app-context';
import { AppLayout } from '@/components/app-layout';

export const metadata: Metadata = {
  title: 'Meu Saldo IA | Controle Financeiro',
  description: 'Seu assistente financeiro pessoal com inteligência artificial.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          <div className="flex justify-center">
            <div className="w-full max-w-[420px] bg-white shadow-lg rounded-lg min-h-screen flex flex-col">
              <AppLayout>
                {children}
              </AppLayout>
            </div>
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
