"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfigLoader = createConfigLoader;
const promises_1 = __importDefault(require("fs/promises"));
const chokidar_1 = __importDefault(require("chokidar"));
const validator_1 = require("./validator");
const CONFIG_FILE = './config.json';
/**
 * Gestionnaire de configuration avec hot-reload
 */
function createConfigLoader() {
    let currentConfig = null;
    let watcher = null;
    const listeners = [];
    /**
     * Charge la configuration depuis le fichier
     */
    async function load() {
        try {
            const content = await promises_1.default.readFile(CONFIG_FILE, 'utf-8');
            const config = JSON.parse(content);
            const validation = (0, validator_1.validateConfig)(config);
            if (!validation.valid) {
                console.error('[Config] Validation errors:', validation.errors);
                throw new Error('Invalid configuration');
            }
            if (validation.warnings.length > 0) {
                console.warn('[Config] Validation warnings:', validation.warnings);
            }
            currentConfig = config;
            console.log('[Config] Configuration loaded successfully');
            return config;
        }
        catch (error) {
            console.error('[Config] Failed to load configuration:', error);
            throw error;
        }
    }
    /**
     * Sauvegarde la configuration dans le fichier
     */
    async function save(config) {
        const validation = (0, validator_1.validateConfig)(config);
        if (!validation.valid) {
            throw new Error('Invalid configuration: ' + validation.errors.map(e => e.message).join(', '));
        }
        config.meta.lastModified = new Date().toISOString();
        await promises_1.default.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
        currentConfig = config;
        console.log('[Config] Configuration saved successfully');
    }
    /**
     * Obtient la configuration actuelle
     */
    function get() {
        if (!currentConfig) {
            throw new Error('Configuration not loaded');
        }
        return currentConfig;
    }
    /**
     * Démarre le watcher pour hot-reload
     */
    function startWatching() {
        if (watcher) {
            return;
        }
        watcher = chokidar_1.default.watch(CONFIG_FILE, {
            persistent: true,
            ignoreInitial: true
        });
        watcher.on('change', async () => {
            console.log('[Config] Configuration file changed, reloading...');
            try {
                const newConfig = await load();
                notifyListeners(newConfig);
            }
            catch (error) {
                console.error('[Config] Failed to reload configuration:', error);
            }
        });
        console.log('[Config] Watching configuration file for changes');
    }
    /**
     * Arrête le watcher
     */
    function stopWatching() {
        if (watcher) {
            watcher.close();
            watcher = null;
            console.log('[Config] Stopped watching configuration file');
        }
    }
    /**
     * Ajoute un listener pour les changements de configuration
     */
    function onChange(callback) {
        listeners.push(callback);
    }
    /**
     * Notifie tous les listeners
     */
    function notifyListeners(config) {
        for (const listener of listeners) {
            try {
                listener(config);
            }
            catch (error) {
                console.error('[Config] Error in change listener:', error);
            }
        }
    }
    return {
        load,
        save,
        get,
        startWatching,
        stopWatching,
        onChange
    };
}
//# sourceMappingURL=loader.js.map