import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import { DocumentView, EvidenceList, Panel, SectionTitle } from '@/components/Archive';
import { ArchiveImage } from '@/components/ArchiveImage';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DraftMark } from '@/components/DraftMark';
import { Icon } from '@/components/Icon';
import { MediaPlayer } from '@/components/MediaPlayer';
import { plain, Txt } from '@/components/Txt';
import { formatDate } from '@/lib/format';
import { DATE_ACCURACY, evidenceHref, getEvidence, MEDIA_LABEL, publicEvidence, relatedEvidence } from '@/lib/registry';

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => publicEvidence.map((e) => ({ id: e.id.toLowerCase() }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getEvidence((await params).id);
  return { title: item ? `${item.id}: ${plain(item.title)}` : 'Not found' };
}

export default async function EvidenceItemPage({ params }: Props) {
  const item = getEvidence((await params).id);
  if (!item) notFound();

  const index = publicEvidence.indexOf(item);
  const prev = publicEvidence[index - 1];
  const next = publicEvidence[index + 1];
  const av = item.mediaType === 'video' || item.mediaType === 'audio' ? item.mediaType : null;

  const details: [string, string][] = [
    ['Reference', item.id],
    ['Category', item.category],
    ['Date', formatDate(item.date, item.dateConfidence)],
    ['Date accuracy', DATE_ACCURACY[item.dateConfidence]],
    ['Source', item.source],
    ['Source type', item.sourceType],
    ['Verification', item.verificationStatus],
    ['Media type', MEDIA_LABEL[item.mediaType]],
    ['Original filename', item.filename],
    ['Original format', item.originalFormat],
    ['File size', item.fileSize],
    ['Added to archive', item.addedToArchive],
  ];

  return (
    <>
      <Breadcrumbs trail={[['Evidence Archive', '/evidence/'], [item.id]]} />
      <div className="wrap pt-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-rule pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">
              Archive item <span className="file-id ml-1 !text-[12px]">{item.id}</span>
              <span className="mx-2 text-rule-dark">/</span>
              {item.category}
            </p>
            <h1 className="page-title mt-2">
              {item.title}
              <DraftMark status={item.canonStatus} />
            </h1>
          </div>
          <nav aria-label="Archive item navigation" className="flex shrink-0 gap-2">
            {prev && (
              <Link className="btn" href={evidenceHref(prev.id)} title={prev.title}>
                ‹ {prev.id}
              </Link>
            )}
            {next && (
              <Link className="btn" href={evidenceHref(next.id)} title={next.title}>
                {next.id} ›
              </Link>
            )}
          </nav>
        </header>

        {av && (
          <section className="mb-10" aria-label="Media player">
            <MediaPlayer id={item.id} kind={av} src={item.file?.src} poster={item.file?.poster} filename={item.filename} />
            <p className="mt-2 text-[12px] text-ink-muted">
              Original format: <Txt>{item.originalFormat}</Txt>. Presented as received; quality reflects the source
              recording.
            </p>
          </section>
        )}

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-10">
            {item.mediaType === 'image' && (
              <div className="max-w-[560px]">
                <ArchiveImage id={item.id} src={item.file?.src} alt={plain(item.title)} caption={item.caption} ratio="4 / 3" showOriginalLink />
              </div>
            )}
            {item.mediaType === 'document' && <DocumentView item={item} />}

            <section>
              <SectionTitle>Description</SectionTitle>
              <p className="prose-archive max-w-[640px]">
                <Txt>{item.description}</Txt>
              </p>
            </section>

            {av && item.body && (
              <section>
                <SectionTitle>Transcript</SectionTitle>
                <div className="prose-archive max-w-[640px]">
                  {item.body.map((p, i) => (
                    <p key={i}>
                      <Txt>{p}</Txt>
                    </p>
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionTitle>Provenance</SectionTitle>
              <ol className="max-w-[640px] border border-rule bg-white">
                {item.provenance.map((step, i) => (
                  <li key={i} className="flex gap-3 border-t border-fog px-4 py-2.5 text-[13.5px] first:border-t-0">
                    <span className="font-narrow font-bold text-steel">{String(i + 1).padStart(2, '0')}</span>
                    <Txt>{step}</Txt>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-6">
            <Panel title="Item details">
              <dl className="facts px-4 pb-2 pt-1 text-[13px]">
                {details.map(([k, v]) => (
                  <Fragment key={k}>
                    <dt>{k}</dt>
                    <dd className={k === 'Original filename' || k === 'Reference' ? 'file-id !text-[12.5px] !text-ink break-all' : ''}>
                      <Txt>{v}</Txt>
                    </dd>
                  </Fragment>
                ))}
              </dl>
            </Panel>

            <Panel title="Original file">
              <div className="px-4 py-3.5 text-[13px]">
                {item.file ? (
                  <a className="btn inline-flex items-center gap-2" href={item.file.src} download={item.filename}>
                    <Icon name="download" size={13} /> Download original
                  </a>
                ) : (
                  <p className="text-ink-muted">The original file is not available for download.</p>
                )}
              </div>
            </Panel>

            <Panel title="Related items">
              <div className="p-3">
                <EvidenceList items={relatedEvidence(item.relatedEvidenceIds)} />
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}
