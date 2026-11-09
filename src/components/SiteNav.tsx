'use client';

import Form from 'next/form';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from './Icon';

const NAV = [
  ['/home/', 'Home'],
  ['/timeline/', 'Case Timeline'],
  ['/people/', 'People'],
  ['/evidence/', 'Evidence Archive'],
  ['/media/', 'Media'],
  ['/press/', 'Press'],
  ['/submit/', 'Submit a Solution'],
] as const;

const trim = (p: string) => p.replace(/\/+$/, '') || '/';

export function SiteNav() {
  const path = trim(usePathname() ?? '/');
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => {
    const h = trim(href);
    return path === h || path.startsWith(`${h}/`);
  };

  return (
    <nav aria-label="Main" className="wrap">
      <button
        type="button"
        className="mb-3 flex items-center gap-2 font-narrow text-[14px] font-bold uppercase tracking-[.1em] text-[#c9d4df] lg:hidden"
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="menu" /> Menu
      </button>
      <div
        className={`${open ? 'flex' : 'hidden'} flex-col gap-3 pb-4 lg:flex lg:flex-row lg:items-end lg:justify-between lg:gap-4 lg:pb-0`}
      >
        <ul id="main-nav" className="main-nav flex flex-col lg:flex-row lg:gap-0.5">
          {NAV.map(([href, label]) => (
            <li key={href}>
              <Link href={href} aria-current={isActive(href) ? 'page' : undefined} onClick={() => setOpen(false)}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <Form action="/evidence/" role="search" className="nav-search flex lg:mb-[7px]">
          <label htmlFor="site-q" className="sr-only">
            Search the archive
          </label>
          <input id="site-q" name="q" type="search" placeholder="Search the archive" autoComplete="off" />
          <button type="submit" aria-label="Search">
            <Icon name="search" size={13} />
          </button>
        </Form>
      </div>
    </nav>
  );
}
