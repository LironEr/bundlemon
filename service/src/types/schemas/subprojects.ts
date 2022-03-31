/* istanbul ignore file */

import type { BaseGetRequestSchema, ProjectIdParams } from './common';

export interface GetSubprojectsRequestSchema extends BaseGetRequestSchema {
  params: ProjectIdParams;
}
