import { randomBytes } from 'crypto';
import { createHash } from '../src/utils/hashUtils';
import { createProject } from '../src/framework/mongo';

export async function createProjectInDB() {
  const apiKey = randomBytes(32).toString('hex');
  const startKey = apiKey.substring(0, 3);

  const hash = await createHash(apiKey);
  const projectId = await createProject({ hash, startKey });

  return { projectId, apiKey };
}
