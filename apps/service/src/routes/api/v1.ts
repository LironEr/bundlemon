import {
  reviewCommitRecordController,
  createCommitRecordController,
  getCommitRecordsController,
  getCommitRecordWithBaseController,
} from '../../controllers/commitRecordsController';
import { createProjectController, getOrCreateProjectIdController } from '../../controllers/projectsController';
import {
  CreateCommitRecordRequestSchema,
  GetCommitRecordsRequestSchema,
  GetCommitRecordRequestSchema,
  GetSubprojectsRequestSchema,
  GetOrCreateProjectIdRequestSchema,
  GithubOutputRequestSchema,
  LoginRequestSchema,
  ReviewCommitRecordRequestSchema,
} from '../../consts/schemas';
import { getSubprojectsController } from '../../controllers/subprojectsController';
import { githubOutputController } from '../../controllers/githubController';
import { loginController, logoutController } from '../../controllers/authController';
import { authMiddleware } from '../../middlewares/auth';
import { meController } from '../../controllers/usersController';

import type { FastifyPluginCallback } from 'fastify';

const commitRecordRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.get('/base', { schema: GetCommitRecordRequestSchema.properties }, getCommitRecordWithBaseController);
  app.post('/outputs/github', { schema: GithubOutputRequestSchema.properties }, githubOutputController);
  app.post(
    '/reviews',
    { schema: ReviewCommitRecordRequestSchema.properties, preValidation: [authMiddleware] },
    reviewCommitRecordController
  );

  done();
};

const commitRecordsRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.get('/', { schema: GetCommitRecordsRequestSchema.properties }, getCommitRecordsController);
  app.post('/', { schema: CreateCommitRecordRequestSchema.properties }, createCommitRecordController);

  app.register(commitRecordRoutes, { prefix: '/:commitRecordId' });

  done();
};

const subprojectsRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.get('/', { schema: GetSubprojectsRequestSchema.properties }, getSubprojectsController);

  done();
};

const projectRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.register(commitRecordsRoutes, { prefix: '/commit-records' });
  app.register(subprojectsRoutes, { prefix: '/subprojects' });

  done();
};

const projectsRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.post('/', createProjectController);
  app.post('/id', { schema: GetOrCreateProjectIdRequestSchema.properties }, getOrCreateProjectIdController);

  app.register(projectRoutes, { prefix: '/:projectId' });

  done();
};

const authRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.post('/login', { schema: LoginRequestSchema.properties }, loginController);
  app.post('/logout', logoutController);

  done();
};

const usersRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.addHook('preValidation', authMiddleware);

  app.get('/me', meController);

  done();
};

const v1Routes: FastifyPluginCallback = (app, _opts, done) => {
  app.register(projectsRoutes, { prefix: '/projects' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(usersRoutes, { prefix: '/users' });

  done();
};

export default v1Routes;
