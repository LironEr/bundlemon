import type { RouteHandlerMethod } from 'fastify';

export const meController: RouteHandlerMethod = async (req) => {
  const { auth, ...user } = req.getUser();

  return user;
};
