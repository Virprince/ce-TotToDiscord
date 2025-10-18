import fs from 'fs/promises';
import chokidar from 'chokidar';
import { Config } from '../types';
import { validateConfig } from './validator';

const CONFIG_FILE = './config.json';

/**
 * Gestionnaire de configuration avec hot-reload
 */
export function createConfigLoader() {
  let currentConfig: Config | null = null;
  let watcher: chokidar.FSWatcher | null = null;
  const listeners: Array<(config: Config) => void> = [];
  
  /**
   * Charge la configuration depuis le fichier
   */
  async function load(): Promise<Config> {
    try {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8');
      const config: Config = JSON.parse(content);
      
      const validation = validateConfig(config);
      
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
    } catch (error) {
      console.error('[Config] Failed to load configuration:', error);
      throw error;
    }
  }
  
  /**
   * Sauvegarde la configuration dans le fichier
   */
  async function save(config: Config): Promise<void> {
    const validation = validateConfig(config);
    
    if (!validation.valid) {
      throw new Error('Invalid configuration: ' + validation.errors.map(e => e.message).join(', '));
    }
    
    config.meta.lastModified = new Date().toISOString();
    
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    currentConfig = config;
    
    console.log('[Config] Configuration saved successfully');
  }
  
  /**
   * Obtient la configuration actuelle
   */
  function get(): Config {
    if (!currentConfig) {
      throw new Error('Configuration not loaded');
    }
    return currentConfig;
  }
  
  /**
   * Démarre le watcher pour hot-reload
   */
  function startWatching(): void {
    if (watcher) {
      return;
    }
    
    watcher = chokidar.watch(CONFIG_FILE, {
      persistent: true,
      ignoreInitial: true
    });
    
    watcher.on('change', async () => {
      console.log('[Config] Configuration file changed, reloading...');
      try {
        const newConfig = await load();
        notifyListeners(newConfig);
      } catch (error) {
        console.error('[Config] Failed to reload configuration:', error);
      }
    });
    
    console.log('[Config] Watching configuration file for changes');
  }
  
  /**
   * Arrête le watcher
   */
  function stopWatching(): void {
    if (watcher) {
      watcher.close();
      watcher = null;
      console.log('[Config] Stopped watching configuration file');
    }
  }
  
  /**
   * Ajoute un listener pour les changements de configuration
   */
  function onChange(callback: (config: Config) => void): void {
    listeners.push(callback);
  }
  
  /**
   * Notifie tous les listeners
   */
  function notifyListeners(config: Config): void {
    for (const listener of listeners) {
      try {
        listener(config);
      } catch (error) {
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