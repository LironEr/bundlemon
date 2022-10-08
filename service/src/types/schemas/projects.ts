/* istanbul ignore file */

import { ProjectProvider } from 'bundlemon-utils';
import { GitDetails } from '../../types';

type GithubProviderAuthQuery = {
  runId: string;
  commitSha: string;
};

type GithubProviderRequest = {
  body: Omit<GitDetails, 'provider'> & { provider: ProjectProvider.GitHub };
  query: GithubProviderAuthQuery;
};

export type GetOrCreateProjectIdRequestSchema = GithubProviderRequest;
