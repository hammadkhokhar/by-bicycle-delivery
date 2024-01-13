import { createLogger, format, transports } from 'winston'

const { combine, timestamp, printf, json, align } = format

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD hh:mm:ss.SSS A',
    }),
    align(),
    json(),
    printf((info) => {
      // Exclude circular references before stringifying
      const sanitizedInfo = {
        message: info.message,
        method: info.method,
        endpoint: info.endpoint,
        body: info.body,
      };

      return `[${info.timestamp}] ${info.level}: ${JSON.stringify(sanitizedInfo)}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'info.log', level: 'info' }),
    new transports.File({ filename: 'error.log', level: 'error' }),
  ],
})

export default logger