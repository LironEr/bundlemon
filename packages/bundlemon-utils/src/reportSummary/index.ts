import { calcReportSummary } from './utils';

import type { Report, ReportSummary, CurrentFilesDetails } from '../types';

export function getReportSummary({ files, defaultCompression }: CurrentFilesDetails, base?: Report): ReportSummary {
  const reportSummary = calcReportSummary(files, base?.files);

  return { defaultCompression, ...reportSummary };
}
