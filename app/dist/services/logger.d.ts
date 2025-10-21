import { Config } from '../types';
/**
 * Crée un logger Winston avec rotation mensuelle
 */
export declare function createEventLogger(config: Config): {
    log: (fileName: string, message: string) => void;
    close: () => void;
};
/**
 * Liste les fichiers de log disponibles
 */
export declare function listLogFiles(logDirectory: string): Promise<string[]>;
//# sourceMappingURL=logger.d.ts.map