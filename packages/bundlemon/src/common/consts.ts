export enum EnvVar {
  projectId = 'BUNDLEMON_PROJECT_ID',
  projectApiKey = 'BUNDLEMON_PROJECT_APIKEY',
  serviceURL = 'BUNDLEMON_SERVICE_URL',
  githubToken = 'BUNDLEMON_GITHUB_TOKEN',
}

export const serviceUrl = process.env[EnvVar.serviceURL] || 'https://bundlemon.now.sh';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON = require('../../package.json');

export const version = packageJSON.version;
