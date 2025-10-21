"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventLogger = createEventLogger;
exports.listLogFiles = listLogFiles;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
/**
 * Crée un logger Winston avec rotation mensuelle
 */
function createEventLogger(config) {
    const loggers = new Map();
    /**
     * Obtient ou crée un logger pour un fichier spécifique
     */
    function getLogger(fileName) {
        if (loggers.has(fileName)) {
            return loggers.get(fileName);
        }
        const datePattern = getDatePattern(config.global.logRotation);
        const transport = new winston_daily_rotate_file_1.default({
            dirname: path_1.default.resolve(config.global.logDirectory),
            filename: `%DATE%/${fileName}.log`,
            datePattern: datePattern,
            maxFiles: '12m',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: config.global.logDateFormat }), winston_1.default.format.printf(({ timestamp, message }) => {
                return `${timestamp} | ${message}`;
            }))
        });
        const logger = winston_1.default.createLogger({
            transports: [transport]
        });
        loggers.set(fileName, logger);
        return logger;
    }
    /**
     * Log un message dans un fichier spécifique
     */
    function log(fileName, message) {
        const logger = getLogger(fileName);
        logger.info(message);
    }
    /**
     * Ferme tous les loggers
     */
    function close() {
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
function getDatePattern(rotation) {
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
async function listLogFiles(logDirectory) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
    const files = [];
    try {
        const entries = await fs.readdir(logDirectory, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subDir = path_1.default.join(logDirectory, entry.name);
                const subFiles = await fs.readdir(subDir);
                files.push(...subFiles.map(f => path_1.default.join(entry.name, f)));
            }
            else if (entry.name.endsWith('.log')) {
                files.push(entry.name);
            }
        }
    }
    catch (error) {
        console.error('Error listing log files:', error);
    }
    return files.sort().reverse();
}
//# sourceMappingURL=logger.js.map