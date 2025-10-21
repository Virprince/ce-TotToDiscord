import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { Config } from '../types';

/**
 * Crée un logger Winston avec rotation mensuelle
 */
export function createEventLogger(config: Config) {
  const loggers = new Map<string, winston.Logger>();
  
  /**
   * Obtient ou crée un logger pour un fichier spécifique
   */
  function getLogger(fileName: string): winston.Logger {
    if (loggers.has(fileName)) {
      return loggers.get(fileName)!;
    }
    
    const datePattern = getDatePattern(config.global.logRotation);
    
    const transport = new DailyRotateFile({
      dirname: path.resolve(config.global.logDirectory),
      filename: `%DATE%/${fileName}.log`,
      datePattern: datePattern,
      maxFiles: '12m',
      format: winston.format.combine(
        winston.format.timestamp({ format: config.global.logDateFormat }),
        winston.format.printf(({ timestamp, message }) => {
          return `${timestamp} | ${message}`;
        })
      )
    });
    
    const logger = winston.createLogger({
      transports: [transport]
    });
    
    loggers.set(fileName, logger);
    return logger;
  }
  
  /**
   * Log un message dans un fichier spécifique
   */
  function log(fileName: string, message: string): void {
    const logger = getLogger(fileName);
    logger.info(message);
  }
  
  /**
   * Ferme tous les loggers
   */
  function close(): void {
    for (const logger of loggers.values()) {
      logger.close();
    }
    loggers.clear();
  }
  
  return {
    log,
    close
  };
}

/**
 * Convertit le type de rotation en pattern de date
 */
function getDatePattern(rotation: Config['global']['logRotation']): string {
  switch (rotation) {
    case 'daily':
      return 'YYYY-MM-DD';
    case 'weekly':
      return 'YYYY-[W]WW';
    case 'monthly':
      return 'YYYY-MM';
    default:
      return 'YYYY-MM';
  }
}

/**
 * Liste les fichiers de log disponibles
 */
export async function listLogFiles(logDirectory: string): Promise<string[]> {
  const fs = await import('fs/promises');
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(logDirectory, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(logDirectory, entry.name);
        const subFiles = await fs.readdir(subDir);
        files.push(...subFiles.map(f => path.join(entry.name, f)));
      } else if (entry.name.endsWith('.log')) {
        files.push(entry.name);
      }
    }
  } catch (error) {
    console.error('Error listing log files:', error);
  }
  
  return files.sort().reverse();
}