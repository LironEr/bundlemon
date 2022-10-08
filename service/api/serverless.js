import init from '../dist';

export default async (req, res) => {
  const app = init();

  await app.ready();

  app.server.emit('request', req, res);
};
