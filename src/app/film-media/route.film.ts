// FILM BUILD ONLY. Lists the files in private/media for the production console.
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dir = path.join(process.cwd(), 'private', 'media');
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = entries.filter((e) => e.isFile() && !e.name.startsWith('.') && e.name !== 'README.md').map((e) => e.name);
  return Response.json(files.sort());
}
