import * as env from 'env-var';
import { Buffer } from 'buffer';
import * as sodium from 'sodium-native';
const getRequiredString = (key: string) => env.get(key).required().asString();
const getOptionalString = (key: string) => env.get(key).asString();
const getOptionalIntPositive = (key: string) => env.get(key).asIntPositive();
const getOptionalBoolean = (key: string) => env.get(key).asBool();

function generateSecretKey() {
  const buf = Buffer.allocUnsafe(sodium.crypto_secretbox_KEYBYTES);
  sodium.randombytes_buf(buf);
  return buf.toString('hex');
}

export const nodeEnv = getRequiredString('NODE_ENV');
export const mongoUrl = getRequiredString('MONGO_URL');
export const mongoDbName = getRequiredString('MONGO_DB_NAME');
export const mongoDbUser = getRequiredString('MONGO_DB_USER');
export const mongoDbPassword = getRequiredString('MONGO_DB_PASSWORD');

export const httpSchema = getOptionalString('HTTP_SCHEMA') || 'https';
export const host = getOptionalString('HOST') || '0.0.0.0';
export const port = getOptionalIntPositive('PORT') || 8080;
export const rootDomain = getOptionalString('ROOT_DOMAIN') || 'bundlemon.dev';
export const appDomain = getOptionalString('APP_DOMAIN') || rootDomain;
export const secretSessionKey = getOptionalString('SECRET_SESSION_KEY') || generateSecretKey();
export const isTestEnv = getOptionalBoolean('IS_TEST_ENV') ?? false;
export const shouldServeWebsite = getOptionalBoolean('SHOULD_SERVE_WEBSITE') ?? true;
export const maxSessionAgeSeconds = getOptionalIntPositive('MAX_SESSION_AGE_SECONDS') || 60 * 60 * 6; // 6 hours
export const maxBodySizeBytes = getOptionalIntPositive('MAX_BODY_SIZE_BYTES') || 1024 * 1024; // 1MB
export const shouldRunDbInit = getOptionalBoolean('SHOULD_RUN_DB_INIT') ?? true;

export const githubAppId = getOptionalString('GITHUB_APP_ID');
export const githubAppPrivateKey = getOptionalString('GITHUB_APP_PRIVATE_KEY');
export const githubAppClientId = getOptionalString('GITHUB_APP_CLIENT_ID');
export const githubAppClientSecret = getOptionalString('GITHUB_APP_CLIENT_SECRET');
