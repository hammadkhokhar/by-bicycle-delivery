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
    printf(
      (info) => `[${info.timestamp}] ${info.level}: ${JSON.stringify(info)}`,
    ),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'info.log', level: 'info' }),
    new transports.File({ filename: 'error.log', level: 'error' }),
  ],
})

export default logger
