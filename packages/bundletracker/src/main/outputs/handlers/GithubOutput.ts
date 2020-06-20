import * as yup from 'yup';
import logger from '../../../common/logger';
import { validateYup } from '../../utils/validationUtils';
import BaseOutput from './BaseOutput';
import { ReportOutputName, ReportData } from './types';

export interface GithubOutputOptions {
  statusCheck?: boolean;
  comment?: boolean;
}

export default class GithubOutput extends BaseOutput<ReportOutputName.github> {
  validate = async (): Promise<void> => {
    logger.debug('Validate github output options');

    validateYup(
      yup.object().required().shape<GithubOutputOptions>({
        statusCheck: yup.boolean().optional(),
        comment: yup.boolean().optional(),
      }),
      this.options,
      'github output'
    );

    // TODO: check env vars

    await new Promise((res) => {
      setTimeout(() => res(), 5000);
    });
  };

  generate = async (reportData: ReportData): Promise<void> => {
    // TODO: generate
    console.log('TCL: GithubOutput -> reportData', reportData);
  };
}
