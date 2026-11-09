import type { CSSProperties } from 'react';
import type { MediaType } from '@/content/types';
import { Icon } from './Icon';

const LABEL: Record<MediaType, string> = {
  image: 'Photograph not available',
  video: 'Video unavailable',
  audio: 'Audio unavailable',
  document: 'File unavailable',
};

/** In-world "missing file" state. Also the placeholder until a real asset is supplied. */
export function MissingMedia({
  kind,
  id,
  className = '',
  style,
  compact,
}: {
  kind: MediaType;
  id: string;
  className?: string;
  style?: CSSProperties;
  compact?: boolean;
}) {
  return (
    <div className={`media-missing ${className}`} style={style} role="img" aria-label={`${LABEL[kind]} (${id})`}>
      <Icon name={kind} size={compact ? 16 : 22} />
      {!compact && (
        <>
          <span className="font-narrow text-[11px] font-bold uppercase tracking-[.14em]">{LABEL[kind]}</span>
          <span className="file-id !text-[11px] !text-[#7d8fa3]">{id}</span>
        </>
      )}
    </div>
  );
}

/** Small table/list thumbnail for an archive item. */
export function Thumb({ kind, id, src, size = 'sm' }: { kind: MediaType; id: string; src?: string | null; size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-[42px] w-[56px]' : 'h-[54px] w-[72px]';
  return (
    <div className={`${box} shrink-0 border border-rule bg-white p-[2px]`}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <MissingMedia kind={kind} id={id} compact className="h-full w-full" />
      )}
    </div>
  );
}
