import { calcDiffSummary } from './utils';

import type { CommitRecord, DiffSummary, CurrentFilesDetails } from '../types';

export function getDiffSummary({ files, defaultCompression }: CurrentFilesDetails, base?: CommitRecord): DiffSummary {
  const diffSummary = calcDiffSummary(files, base?.files);

  return { defaultCompression, ...diffSummary };
}
