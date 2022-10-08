import { ObjectId } from 'mongodb';
import { getCollection } from './client';

import type { ProjectApiKey, GitDetails } from '../../types';

type WithSimpleId<T> = T & { id: string };

type BaseProjectDB = {
  creationDate: Date;
  lastAccessed: Date;
  lastRecordAt?: Date;
};

type ApiKeyProjectDB = BaseProjectDB & {
  apiKey: ProjectApiKey;
};
export type ApiKeyProject = WithSimpleId<ApiKeyProjectDB>;

type GitProjectDB = BaseProjectDB & GitDetails;
export type GitProject = WithSimpleId<GitProjectDB>;

export type ProjectDB = ApiKeyProjectDB | GitProjectDB;
export type Project = ApiKeyProject | GitProject;

export const getProjectsCollection = () => getCollection<ProjectDB>('projects');

export const createProject = async (apiKey: ProjectApiKey): Promise<string> => {
  const projectsCollection = await getProjectsCollection();
  const id = (await projectsCollection.insertOne({ apiKey, creationDate: new Date(), lastAccessed: new Date() }))
    .insertedId;

  return id.toHexString();
};

// TODO: update lastAccess?
export const getProject = async (projectId: string): Promise<Project | undefined> => {
  const projectsCollection = await getProjectsCollection();
  const data = await projectsCollection.findOne({ _id: new ObjectId(projectId) });

  if (data) {
    const { _id, ...rest } = data;
    return { id: _id.toHexString(), ...rest };
  }

  return undefined;
};

export const getOrCreateProjectId = async (details: GitDetails): Promise<string> => {
  const projectsCollection = await getProjectsCollection();
  const result = await projectsCollection.findOneAndUpdate(
    details,
    {
      $setOnInsert: { creationDate: new Date() },
      $set: { lastAccessed: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (result.ok === 1 && result.value) {
    return result.value._id.toHexString();
  }

  throw new Error('failed to get or update project');
};

export const setProjectLastRecordDate = async (projectId: string, lastRecordDate: Date): Promise<void> => {
  const projectsCollection = await getProjectsCollection();

  await projectsCollection.findOneAndUpdate(
    { _id: new ObjectId(projectId) },
    { $set: { lastRecordAt: lastRecordDate } }
  );
};
