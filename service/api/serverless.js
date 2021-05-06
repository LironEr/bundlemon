import init from '../src/app';

export default async (req, res) => {
  const app = init();

  await app.ready();

  app.server.emit('request', req, res);
};
