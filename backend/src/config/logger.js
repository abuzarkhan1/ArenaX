import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Custom color scheme
const levelColors = {
  error: chalk.bold.red,
  warn: chalk.bold.yellow,
  info: chalk.bold.cyan,
  http: chalk.bold.magenta,
  debug: chalk.bold.blue,
};

const messageColors = {
  server: chalk.green,
  database: chalk.blue,
  socket: chalk.magenta,
  settings: chalk.yellow,
  auth: chalk.cyan,
  tournament: chalk.green,
  transaction: chalk.blue,
  default: chalk.white,
};

// Helper to colorize message based on content
const colorizeMessage = (message) => {
  if (message.includes('Server') || message.includes('PORT')) return messageColors.server(message);
  if (message.includes('MongoDB') || message.includes('Database')) return messageColors.database(message);
  if (message.includes('Socket') || message.includes('Client')) return messageColors.socket(message);
  if (message.includes('Settings') || message.includes('setting')) return messageColors.settings(message);
  if (message.includes('Auth') || message.includes('Login') || message.includes('Token')) return messageColors.auth(message);
  if (message.includes('Tournament')) return messageColors.tournament(message);
  if (message.includes('Transaction') || message.includes('Deposit') || message.includes('Withdrawal')) return messageColors.transaction(message);
  return messageColors.default(message);
};

// Console format with Chalk colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const coloredLevel = levelColors[level] ? levelColors[level](`[${level.toUpperCase()}]`) : `[${level.toUpperCase()}]`;
    const coloredTimestamp = chalk.gray(timestamp);
    const coloredMessage = colorizeMessage(message);
    
    let output = `${coloredTimestamp} ${coloredLevel} ${coloredMessage}`;
    
    // Add metadata if present (excluding service)
    const metaKeys = Object.keys(meta).filter(key => key !== 'service');
    if (metaKeys.length > 0) {
      const metaObj = {};
      metaKeys.forEach(key => metaObj[key] = meta[key]);
      output += ` ${chalk.dim(JSON.stringify(metaObj))}`;
    }
    
    return output;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'arenax-backend' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;
