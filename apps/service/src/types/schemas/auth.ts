/* istanbul ignore file */

import type { BaseRequestSchema } from './common';

export interface LoginRequestSchema extends BaseRequestSchema {
  body: {
    provider: 'github';
    code: string;
  };
}
