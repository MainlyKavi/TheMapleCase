import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="content" className="wrap pt-12">
        <p className="kicker">Error 404</p>
        <h1 className="page-title mt-2">Page not found</h1>
        <p className="page-intro mt-3">
          The page you requested could not be found. It may have been moved or removed from the archive.
        </p>
        <p className="mt-6 flex flex-wrap gap-2.5">
          <Link className="btn btn-primary" href="/">
            Case overview
          </Link>
          <Link className="btn" href="/evidence/">
            Search the evidence archive
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
