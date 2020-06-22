import { NormalizedConfig } from '../../types';
import { ReportData } from './types';
import { ReportOutputName, ReportOutputOptions } from './types';

export default abstract class BaseOutput<Name extends ReportOutputName> {
  abstract outputName: ReportOutputName;

  options: ReportOutputOptions[Name];
  config: NormalizedConfig;

  constructor({ options, config }: { options: ReportOutputOptions[Name]; config: NormalizedConfig }) {
    this.options = options;
    this.config = config;
  }

  abstract areOptionsValid(): Promise<boolean> | boolean;
  abstract isEnabled(): boolean;
  abstract generate(reportData: ReportData): Promise<void> | void;
}
