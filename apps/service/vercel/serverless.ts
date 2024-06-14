import init from '../src/app';

export default async (req: any, res: any) => {
  const app = init();

  await app.ready();

  app.server.emit('request', req, res);
};
