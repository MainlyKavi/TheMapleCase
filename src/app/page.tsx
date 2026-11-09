import type { Metadata } from 'next';
import { desktopStage } from '@stage/desktop';
import { buildFs } from '@/desktop/content/build-fs';
import { Desktop } from '@/desktop/shell/Desktop';

export const metadata: Metadata = {
  title: { absolute: 'The Maple Case' },
  description: 'An archive of the investigation into the disappearance of Cristina Maple.',
};

// The filesystem is built here, on the server, from the public content records. Only this
// release-filtered snapshot reaches the browser.
const snapshot = buildFs({ user: desktopStage.account.user, extra: desktopStage.nodes });

export default function DesktopPage() {
  return (
    <>
      <noscript>
        <p style={{ padding: 24, font: '14px sans-serif' }}>
          This desktop needs JavaScript. You can still read the archive: <a href="/home/">The Maple Case</a>.
        </p>
      </noscript>
      <Desktop fs={snapshot} />
    </>
  );
}
