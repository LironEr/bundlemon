export enum EnvVar {
  remoteFlag = 'BUNDLEMON_REMOTE',
  projectId = 'BUNDLEMON_PROJECT_ID',
  projectApiKey = 'BUNDLEMON_PROJECT_APIKEY',
  serviceURL = 'BUNDLEMON_SERVICE_URL',
  subProject = 'BUNDLEMON_SUB_PROJECT',
}

export const serviceUrl = process.env[EnvVar.serviceURL] || 'https://api.bundlemon.dev';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON = require('../../package.json');

export const version = packageJSON.version;

export enum CreateCommitRecordAuthType {
  ProjectApiKey = 'PROJECT_API_KEY',
  GithubActions = 'GITHUB_ACTIONS',
}
