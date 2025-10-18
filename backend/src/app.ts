import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createConfigLoader } from './config/loader';
import { createEventLogger } from './services/logger';
import { createDiscordQueue } from './services/discordQueue';
import { AuthService } from './services/auth';
import { registerRoutes } from './routes';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    }
  });
  
  await fastify.register(cors, {
    origin: true
  });
  
  console.log('[App] Initializing...');
  
  const configLoader = createConfigLoader();
  
  try {
    await configLoader.load();
  } catch (error) {
    console.error('[App] Failed to load configuration. Please ensure config.json exists.');
    process.exit(1);
  }
  
  const config = configLoader.get();
  const eventLogger = createEventLogger(config);
  const discordQueue = createDiscordQueue(config);

  const authService = new AuthService({
    username: process.env.ADMIN_USERNAME || config.auth?.username || 'admin',
    passwordHash: process.env.ADMIN_PASSWORD_HASH || config.auth?.passwordHash || '',
    jwtSecret: process.env.JWT_SECRET || config.auth?.jwtSecret || 'CHANGE_ME_IN_PRODUCTION'
  });
  
  // Si pas de config auth, afficher un warning
  if (!config.auth?.passwordHash) {
    console.warn('[Auth] ⚠️  WARNING: No auth configured! Use scripts/hash-password.ts to generate a hash');
  }
  
  configLoader.onChange((newConfig) => {
    console.log('[App] Configuration updated, reinitializing services...');
  });
  
  configLoader.startWatching();
  
  // ✅ UN SEUL APPEL à registerRoutes (avec authService)
  await registerRoutes(fastify, {
    configLoader,
    eventLogger,
    discordQueue,
    authService  // ← Important !
  });
  
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
  
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`[App] Server listening on http://${HOST}:${PORT}`);
  } catch (error) {
    console.error('[App] Error starting server:', error);
    process.exit(1);
  }
  
  const gracefulShutdown = async () => {
    console.log('[App] Shutting down gracefully...');
    
    configLoader.stopWatching();
    eventLogger.close();
    discordQueue.clear();
    
    await fastify.close();
    console.log('[App] Server closed');
    process.exit(0);
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

start().catch((error) => {
  console.error('[App] Fatal error:', error);
  process.exit(1);
});