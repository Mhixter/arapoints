import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export const logger = {
  info: (message: string, data?: any) => {
    const log = `[${new Date().toISOString()}] INFO: ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    console.log(log);
    fs.appendFileSync(LOG_FILE, log + '\n');
  },
  
  error: (message: string, error?: any) => {
    const log = `[${new Date().toISOString()}] ERROR: ${message}${error ? ' ' + JSON.stringify(error) : ''}`;
    console.error(log);
    fs.appendFileSync(LOG_FILE, log + '\n');
  },
  
  warn: (message: string, data?: any) => {
    const log = `[${new Date().toISOString()}] WARN: ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    console.warn(log);
    fs.appendFileSync(LOG_FILE, log + '\n');
  },
  
  debug: (message: string, data?: any) => {
    const log = `[${new Date().toISOString()}] DEBUG: ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    console.log(log);
    fs.appendFileSync(LOG_FILE, log + '\n');
  },
};
