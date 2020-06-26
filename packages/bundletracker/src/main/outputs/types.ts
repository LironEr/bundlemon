import type { NormalizedConfig, ReportData } from '../types';

export interface OutputCreateParams {
  config: NormalizedConfig;
  options: unknown;
}

export interface OutputInstance {
  generate(reportData: ReportData): Promise<void> | void;
}

export interface Output {
  name: string;
  create: (params: OutputCreateParams) => OutputInstance | undefined | Promise<OutputInstance | undefined>;
}
