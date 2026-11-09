'use client';

import { useMediaSource } from '@stage/client';
import { useState } from 'react';
import { MissingMedia } from './MissingMedia';
import { Txt } from './Txt';

/** A framed archival photograph, or the in-world unavailable state when there is no file. */
export function ArchiveImage({
  id,
  src,
  alt,
  caption,
  ratio = '4 / 5',
  showOriginalLink,
}: {
  id: string;
  src?: string;
  alt: string;
  caption?: string;
  ratio?: string;
  showOriginalLink?: boolean;
}) {
  const media = useMediaSource(id, src);
  const [failed, setFailed] = useState<string | null>(null);
  const ok = media.src && failed !== media.src;

  return (
    <figure>
      <div className="photo-frame">
        {ok ? (
          <img src={media.src} alt={alt} className="block h-auto w-full" onError={() => setFailed(media.src ?? null)} />
        ) : (
          <MissingMedia kind="image" id={id} className="w-full" style={{ aspectRatio: ratio }} />
        )}
      </div>
      {(caption || (ok && showOriginalLink)) && (
        <figcaption className="caption mt-2 flex justify-between gap-3">
          <span>{caption && <Txt>{caption}</Txt>}</span>
          {ok && showOriginalLink && (
            <a href={media.src} target="_blank" rel="noopener" className="shrink-0 font-sans not-italic">
              View original
            </a>
          )}
        </figcaption>
      )}
    </figure>
  );
}
