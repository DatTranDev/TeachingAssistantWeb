import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ColorModeProvider } from '@/contexts/ColorModeContext';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Teaching Assistant',
  description: 'Classroom management platform for lecturers and students',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={openSans.variable}>
      <body
        suppressHydrationWarning
        className="bg-neutral-50 dark:bg-slate-900 text-neutral-900 dark:text-slate-100 antialiased"
      >
        <LanguageProvider>
          <ColorModeProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster richColors position="top-right" />
              </AuthProvider>
            </QueryProvider>
          </ColorModeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
