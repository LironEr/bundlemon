import { ProjectProvider } from 'bundlemon-utils';
import { Project, GitProject } from '../framework/mongo/projects';
import type { FastifyLoggerInstance } from 'fastify';

export function isGitHubProject(project: Project, log: FastifyLoggerInstance): project is GitProject {
  if (!('provider' in project && 'owner' in project && 'repo' in project)) {
    log.warn({ projectId: project.id }, 'project missing provider details');
    return false;
  }
  const { provider } = project;

  if (provider !== ProjectProvider.GitHub) {
    log.warn({ projectId: project.id }, 'project provider is not GitHub');
    return false;
  }

  return true;
}
