/* istanbul ignore file */

import { GitDetails } from '../../types';
import type { BaseRequestSchema } from './common';

export interface GetOrCreateProjectIdRequestSchema extends BaseRequestSchema {
  body: GitDetails;
}
