import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Create a Registry to register the metrics
export const register = new promClient.Registry();

// Enable default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// HTTP error counter
export const httpErrorCount = new promClient.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors by endpoint and status code',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const end = httpRequestDuration.startTimer();
  const route = req.route?.path || req.path;

  res.on('finish', () => {
    const statusCode = res.statusCode;
    if (statusCode >= 400) {
      httpErrorCount.inc({
        method: req.method,
        route,
        status_code: statusCode,
      });
    }
    end({
      method: req.method,
      route,
      status_code: statusCode,
    });
  });

  next();
};

// Handler for metrics endpoint
export const metricsHandler = async (
  _req: Request,
  res: Response
) => {
  try {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (err) {
    res.status(500).send('Error collecting metrics');
  }
};
