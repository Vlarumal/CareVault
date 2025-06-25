import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { RedisClient } from './utils/redis';
import { validateEnv } from './utils/validateEnv';

import diagnosesRouter from './routes/diagnosesRoute';
import patientsRouter from './routes/patientsRoute';
import authRouter from './routes/authRoute';
import { errorHandler } from './utils/errorHandler';
import { metricsMiddleware, metricsHandler } from './utils/metrics';

dotenv.config();

validateEnv();

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'trusted-cdn.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    xssFilter: true,
  })
);

import cookieParser from 'cookie-parser';

app.use((_req, res, next) => {
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(metricsMiddleware);

import { corsMiddleware } from './middleware/corsMiddleware';

app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.static('dist'));
app.use(express.json());

app.use((req, _res, next) => {
  const logBody = { ...req.body };
  const sensitiveFields = [
    'password',
    'newPassword',
    'token',
    'refreshToken',
  ];

  sensitiveFields.forEach((field) => {
    if (logBody[field]) {
      logBody[field] = '**REDACTED**';
    }
  });

  console.log('Received:', logBody);
  next();
});

const PORT = process.env.PORT || 3001;

async function initServices() {
  await RedisClient.healthCheck();
}

app.get('/api/ping', (_req, res) => {
  console.log('someone pinged here');
  res.send('pong');
});

app.use('/api/diagnoses', diagnosesRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/auth', authRouter);

app.get('/api/metrics', metricsHandler);

app.use(errorHandler);

initServices()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Initialization completed successfully');
    });
  })
  .catch((err) => {
    console.error('Initialization failed:', err);
    process.exit(1);
  });

export default app;
