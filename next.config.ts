import type { NextConfig } from 'next';

// Two builds from one codebase:
//   public (default): static export to out/, contains no film-only code or content.
//   film (MAPLE_BUILD=film, see scripts/film.mjs): enables *.film.tsx routes and swaps
//   the @stage modules for the private implementations in private/stage.
const film = process.env.MAPLE_BUILD === 'film';

const stage = film
  ? {
      '@stage': './private/stage/index.tsx',
      '@stage/client': './private/stage/client.tsx',
      '@stage/desktop': './private/stage/desktop.tsx',
    }
  : { '@stage': './src/stage/index.tsx', '@stage/client': './src/stage/client.tsx', '@stage/desktop': './src/stage/desktop.ts' };

const nextConfig: NextConfig = {
  pageExtensions: film ? ['film.tsx', 'film.ts', 'tsx', 'ts'] : ['tsx', 'ts'],
  distDir: film ? '.next-film' : '.next',
  output: film ? undefined : 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  productionBrowserSourceMaps: false,
  turbopack: { resolveAlias: stage },
};

export default nextConfig;
