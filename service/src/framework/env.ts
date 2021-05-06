import * as env from 'env-var';

const getRequiredString = (key: string) => env.get(key).required().asString();
const getOptionalString = (key: string) => env.get(key).asString();

export const nodeEnv = getRequiredString('NODE_ENV');
export const mongoUrl = getRequiredString('MONGO_URL');
export const mongoDbName = getRequiredString('MONGO_DB_NAME');
export const mongoDbUser = getRequiredString('MONGO_DB_USER');
export const mongoDbPassword = getRequiredString('MONGO_DB_PASSWORD');

export const githubAppId = getOptionalString('GITHUB_APP_ID');
export const githubAppPrivateKey = getOptionalString('GITHUB_APP_PRIVATE_KEY');
