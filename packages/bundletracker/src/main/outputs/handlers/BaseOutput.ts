import { NormalizedConfig } from '../../types';
import { ReportData } from './types';
import { ReportOutputName, ReportOutputOptions } from './types';

export default abstract class BaseOutput<Name extends ReportOutputName> {
  options: ReportOutputOptions[Name];
  config: NormalizedConfig;

  constructor({ options, config }: { options: ReportOutputOptions[Name]; config: NormalizedConfig }) {
    this.options = options;
    this.config = config;
  }

  validate(): Promise<void> | void {
    return;
  }

  abstract generate(reportData: ReportData): Promise<void> | void;
}
