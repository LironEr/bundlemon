import { randomBytes } from 'crypto';
import { createHash } from '../src/utils/hashUtils';
import { createProject, getProjectsCollection, GitProject, ProjectDB } from '../src/framework/mongo/projects';
import { ProjectProvider } from 'bundlemon-utils';
import { generateRandomString } from './utils';

export async function createTestProjectWithApiKey() {
  const apiKey = randomBytes(32).toString('hex');
  const startKey = apiKey.substring(0, 3);

  const hash = await createHash(apiKey);
  const projectId = await createProject({ hash, startKey });

  return { projectId, apiKey };
}

export async function createTestGitProject(): Promise<GitProject> {
  const provider = ProjectProvider.GitHub;
  const owner = generateRandomString();
  const repo = generateRandomString();

  const newProject: ProjectDB = { provider, owner, repo, creationDate: new Date(), lastAccessed: new Date() };

  const projectsCollection = await getProjectsCollection();
  const id = (await projectsCollection.insertOne(newProject)).insertedId;

  return { id: id.toHexString(), ...newProject };
}
