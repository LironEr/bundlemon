export const serviceUrl = process.env.BUNDLETRACKER_SERVICE_URL || 'http://localhost:3333';
export enum EnvVar {
  projectId = 'BUNDLETRACKER_PROJECT_ID',
  projectApiKey = 'BUNDLETRACKER_PROJECT_APIKEY',
}
