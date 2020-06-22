export enum EnvVar {
  projectId = 'BUNDLETRACKER_PROJECT_ID',
  projectApiKey = 'BUNDLETRACKER_PROJECT_APIKEY',
  serviceURL = 'BUNDLETRACKER_SERVICE_URL',
  githubToken = 'BUNDLETRACKER_GITHUB_TOKEN',
}
export const serviceUrl = process.env[EnvVar.serviceURL] || 'http://localhost:3333';
