export interface ProjectApiKey {
  hash: string;
  startKey: string;
}

export interface Project {
  id: string;
  creationDate: string;
  apiKey: ProjectApiKey;
}
