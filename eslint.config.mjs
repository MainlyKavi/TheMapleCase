import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', '.next-film/**', 'out/**', 'next-env.d.ts']),
  // Archival images are shown at original resolution from a static export; next/image adds nothing here.
  { rules: { '@next/next/no-img-element': 'off' } },
]);
