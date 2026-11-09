import type { CaseFile, CaseIdentity, Variant } from './types';

// PUBLIC stage (server side). The film build replaces this file with private/stage/index.tsx
// via the @stage alias in next.config.ts. Keep the exports identical in both.

export function StageHead() {
  return null;
}

export const caseVariants = (maple: CaseIdentity): Variant<CaseIdentity>[] => [{ scenes: null, value: maple }];

export const homeVariants = (maple: CaseFile): Variant<CaseFile>[] => [{ scenes: null, value: maple }];
