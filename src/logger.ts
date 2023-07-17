import { createLogger, format, transports } from 'winston';
const { combine, printf, timestamp } = format;

const Logger = createLogger({
  format: combine(
    timestamp(),
    printf(info => {
      return `${info.level}|${info.timestamp}: ${info.message}`;
    })
  ),
  transports: [
    new transports.File({
      filename: 'errors.log',
      dirname: 'logs'
    })
  ]
});

export default Logger;
