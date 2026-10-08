import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const host = env.production ? '0.0.0.0' : '127.0.0.1';
const server = app.listen(env.port, host, () => console.log(`Krishi Sahayak API listening on ${host}:${env.port}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
