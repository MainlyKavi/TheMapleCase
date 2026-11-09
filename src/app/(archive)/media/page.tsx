import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead, SectionTitle } from '@/components/Archive';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Icon } from '@/components/Icon';
import { MissingMedia } from '@/components/MissingMedia';
import { Txt } from '@/components/Txt';
import type { MediaType } from '@/content/types';
import { formatDate } from '@/lib/format';
import { evidenceHref, publicEvidence } from '@/lib/registry';

export const metadata: Metadata = { title: 'Media' };

const SECTIONS: [MediaType, string][] = [
  ['video', 'Video recordings'],
  ['audio', 'Audio recordings'],
  ['image', 'Photographs'],
  ['document', 'Documents'],
];

export default function MediaPage() {
  return (
    <>
      <Breadcrumbs trail={[['Media']]} />
      <div className="wrap pt-8">
        <PageHead kicker="Media library" title="Media">
          Photographs, recordings and documents held by this archive. Where the original file is available it can be
          viewed or played from the item’s page. Files are presented as received, at their original resolution.
        </PageHead>

        <div className="space-y-12">
          {SECTIONS.map(([type, label]) => {
            const items = publicEvidence.filter((e) => e.mediaType === type);
            if (!items.length) return null;
            return (
              <section key={type}>
                <SectionTitle>
                  {label} <span className="ml-1 font-sans text-[13px] font-normal text-ink-muted">({items.length})</span>
                </SectionTitle>
                <ul className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((e) => {
                    const thumb = type === 'image' ? e.file?.src : e.file?.poster;
                    return (
                      <li key={e.id}>
                        <Link href={evidenceHref(e.id)} className="group block">
                          <div className="photo-frame relative">
                            {thumb ? (
                              <img src={thumb} alt="" className="aspect-[4/3] w-full object-cover" />
                            ) : (
                              <MissingMedia kind={type} id={e.id} className="aspect-[4/3] w-full" />
                            )}
                            {(type === 'video' || type === 'audio') && e.file && (
                              <span className="player-big !h-9 !w-12 !rounded-[4px] group-hover:!bg-navy">
                                <Icon name="play" size={15} />
                              </span>
                            )}
                          </div>
                          <p className="mt-2.5 text-[13.5px] font-bold leading-snug group-hover:underline">{e.title}</p>
                        </Link>
                        <p className="mt-1 text-[11.5px] text-ink-muted">
                          <span className="file-id !text-[11px]">{e.id}</span>
                          <span className="mx-1.5 text-rule-dark">·</span>
                          <Txt>{formatDate(e.date, e.dateConfidence)}</Txt>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
