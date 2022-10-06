import * as env from 'env-var';

const getRequiredString = (key: string) => env.get(key).required().asString();
const getOptionalString = (key: string) => env.get(key).asString();
const getOptionalBoolean = (key: string) => env.get(key).asBool();

export const nodeEnv = getRequiredString('NODE_ENV');
export const appDomain = getRequiredString('APP_DOMAIN');
export const mongoUrl = getRequiredString('MONGO_URL');
export const mongoDbName = getRequiredString('MONGO_DB_NAME');
export const mongoDbUser = getRequiredString('MONGO_DB_USER');
export const mongoDbPassword = getRequiredString('MONGO_DB_PASSWORD');
export const secretSessionKey = getRequiredString('SECRET_SESSION_KEY');

export const rootDomain = getOptionalString('ROOT_DOMAIN') || 'bundlemon.dev';
export const isTestEnv = getOptionalBoolean('IS_TEST_ENV') ?? false;

export const githubAppId = getOptionalString('GITHUB_APP_ID');
export const githubAppPrivateKey = getOptionalString('GITHUB_APP_PRIVATE_KEY');
export const githubAppClientId = getOptionalString('GITHUB_APP_CLIENT_ID');
export const githubAppClientSecret = getOptionalString('GITHUB_APP_CLIENT_SECRET');
