import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Toaster } from 'sonner';
import { ConfirmDialogProvider } from '@/components/ConfirmDialogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TioSam BI - Business Intelligence Platform',
  description: 'Plataforma moderna de Business Intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ConfirmDialogProvider>
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 transition-all duration-300">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
          <Toaster position="top-right" richColors />
        </ConfirmDialogProvider>
      </body>
    </html>
  );
}