import { Config } from '../types';
/**
 * Gestionnaire de configuration avec hot-reload
 */
export declare function createConfigLoader(): {
    load: () => Promise<Config>;
    save: (config: Config) => Promise<void>;
    get: () => Config;
    startWatching: () => void;
    stopWatching: () => void;
    onChange: (callback: (config: Config) => void) => void;
};
//# sourceMappingURL=loader.d.ts.map