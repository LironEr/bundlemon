import * as fs from 'fs';
import { httpSchema, rootDomain, githubAppClientId } from '@/framework/env';

const WEBSITE_CONFIG_PATH = '/app/service/public/assets/config.json';

export function overrideWebsiteConfig() {
  const websiteConfig = fs.readFileSync(WEBSITE_CONFIG_PATH);
  let websiteConfigJson = JSON.parse(websiteConfig.toString());

  websiteConfigJson = {
    ...websiteConfigJson,
    bundlemonServiceUrl: `${httpSchema}://${rootDomain}/api`,
    githubAppClientId,
  };

  fs.writeFileSync(WEBSITE_CONFIG_PATH, JSON.stringify(websiteConfigJson));
}
