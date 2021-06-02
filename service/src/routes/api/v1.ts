import {
  createCommitRecordController,
  getCommitRecordsController,
  getCommitRecordWithBaseController,
} from '../../controllers/commitRecordsController';
import { createProjectController } from '../../controllers/projectsController';
import {
  CreateCommitRecordRequestSchema,
  GetCommitRecordsRequestSchema,
  GetCommitRecordRequestSchema,
  CreateGithubCheckRequestSchema,
  CreateGithubCommitStatusRequestSchema,
  PostGithubPRCommentRequestSchema,
} from '../../consts/schemas';

import type { FastifyPluginCallback } from 'fastify';
import {
  createGithubCheckController,
  createGithubCommitStatusController,
  postGithubPRCommentController,
} from '../../controllers/githubController';

const commitRecordRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.get('/base', { schema: GetCommitRecordRequestSchema.properties }, getCommitRecordWithBaseController);

  done();
};

const commitRecordsRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.get('/', { schema: GetCommitRecordsRequestSchema.properties }, getCommitRecordsController);
  app.post('/', { schema: CreateCommitRecordRequestSchema.properties }, createCommitRecordController);

  app.register(commitRecordRoutes, { prefix: '/:commitRecordId' });

  done();
};

const outputsRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.post('/github/check-run', { schema: CreateGithubCheckRequestSchema.properties }, createGithubCheckController);
  app.post(
    '/github/commit-status',
    { schema: CreateGithubCommitStatusRequestSchema.properties },
    createGithubCommitStatusController
  );
  app.post(
    '/github/pr-comment',
    { schema: PostGithubPRCommentRequestSchema.properties },
    postGithubPRCommentController
  );

  done();
};

const projectRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.register(commitRecordsRoutes, { prefix: '/commit-records' });
  app.register(outputsRoutes, { prefix: '/outputs' });

  done();
};

const projectsRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.post('/', createProjectController);

  app.register(projectRoutes, { prefix: '/:projectId' });

  done();
};

const v1Routes: FastifyPluginCallback = (app, _opts, done) => {
  app.register(projectsRoutes, { prefix: '/projects' });

  done();
};

export default v1Routes;
