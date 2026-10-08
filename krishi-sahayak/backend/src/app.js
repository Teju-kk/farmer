import { URL } from 'node:url'; import express from 'express'; import cors from 'cors'; import helmet from 'helmet'; import rateLimit from 'express-rate-limit'; import morgan from 'morgan'; import routes from './routes/index.js'; import { env } from './config/env.js'; import { errorHandler, notFound } from './middleware/errorHandler.js';

function isLocalDevelopmentOrigin(origin) {
  if (env.production) return false;
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

const app = express(); app.set('trust proxy', env.trustProxyHops); app.use(helmet()); app.use(cors({ origin(origin, callback) { return callback(null, !origin || env.frontendOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)); } })); app.use(rateLimit({ windowMs: 900000, max: 300, standardHeaders: 'draft-8', legacyHeaders: false })); app.use('/api/bills', express.json({ limit: '7mb' })); app.use(express.json({ limit: '1mb' })); app.use(morgan(env.production ? 'combined' : 'dev')); app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); }); app.use('/api', routes); app.use(notFound); app.use(errorHandler); export default app;
