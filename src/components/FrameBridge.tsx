'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * When the archive is shown inside the desktop's Safari, report the current page to it.
 * The only message is { type: 'maple:navigate', path, title }, sent to this same origin.
 * Outside a frame this does nothing.
 */
export function FrameBridge() {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    if (window.parent === window) return;
    const send = () => {
      const q = params?.toString();
      window.parent.postMessage({ type: 'maple:navigate', path: `${pathname}${q ? `?${q}` : ''}`, title: document.title }, window.location.origin);
    };
    // Titles update after navigation; report again when the <title> changes.
    send();
    const observer = new MutationObserver(send);
    const head = document.querySelector('title') ?? document.head;
    observer.observe(head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname, params]);
  return null;
}
