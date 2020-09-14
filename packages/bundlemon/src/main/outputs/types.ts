import type { Report } from 'bundlemon-utils';
import type { NormalizedConfig } from '../types';

export interface OutputCreateParams {
  config: NormalizedConfig;
  options: unknown;
}

export interface OutputInstance {
  generate(report: Report): Promise<void> | void;
}

export interface Output {
  name: string;
  create: (params: OutputCreateParams) => OutputInstance | undefined | Promise<OutputInstance | undefined>;
}
