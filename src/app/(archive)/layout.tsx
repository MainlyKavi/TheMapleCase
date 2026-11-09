import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export default function ArchiveLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="content">{children}</main>
      <SiteFooter />
    </>
  );
}
