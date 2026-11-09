import type { Metadata, Viewport } from 'next';
import { PT_Sans_Narrow } from 'next/font/google';
import type { ReactNode } from 'react';
import { StageHead } from '@stage';
import { StageRuntime } from '@stage/client';
import './globals.css';

const narrow = PT_Sans_Narrow({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-pt-narrow',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'The Maple Case', template: '%s | The Maple Case' },
  description: 'An archive of the investigation into the disappearance of Cristina Maple.',
};

export const viewport: Viewport = { themeColor: '#293e56' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={narrow.variable} suppressHydrationWarning>
      <head>
        <StageHead />
      </head>
      <body>
        {children}
        <StageRuntime />
      </body>
    </html>
  );
}
