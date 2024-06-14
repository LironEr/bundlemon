import type { ProjectProvider } from 'bundlemon-utils';

export interface ProjectApiKey {
  hash: string;
  startKey: string;
}

export interface Project {
  id: string;
  creationDate: string;
  apiKey: ProjectApiKey;
}

export interface GitDetails {
  provider: ProjectProvider;
  /**
   * @minLength 1
   * @maxLength 100
   * @pattern ^[a-zA-Z0-9_.-]*$
   */
  owner: string;
  /**
   * @minLength 1
   * @maxLength 100
   * @pattern ^[a-zA-Z0-9_.-]*$
   */
  repo: string;
}
