import winston from 'winston';

const { combine, timestamp, json, errors } = winston.format;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'patient-app-server' },
  transports: [
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          }),
          new winston.transports.File({
            filename: 'combined.log',
            maxsize: 5242880,
            maxFiles: 5
          })
        ]
      : []),
    new winston.transports.Console({
      format: combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export const rotationLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'credential-rotation' },
  transports: [
    new winston.transports.File({
      filename: 'rotation.log',
      maxsize: 10485760, // 10MB
      maxFiles: 3
    }),
    new winston.transports.Console({
      format: combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `[ROTATION] ${timestamp} ${level}: ${message}`;
        })
      )
    })
  ]
});

export default logger;
