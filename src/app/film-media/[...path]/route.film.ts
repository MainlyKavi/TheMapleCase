// FILM BUILD ONLY. Streams a file from private/media, with byte ranges so video can seek.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export const dynamic = 'force-dynamic';

const ROOT = path.join(process.cwd(), 'private', 'media');

const TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

const notFound = () => new Response('Not found', { status: 404 });

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = path.resolve(ROOT, ...(await params).path.map(decodeURIComponent));
  if (!file.startsWith(ROOT + path.sep)) return notFound(); // no path traversal

  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return notFound();

  const size = info.size;
  const headers: Record<string, string> = {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(body, {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
    });
  }

  const body = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(body, { headers: { ...headers, 'Content-Length': String(size) } });
}
