import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs/promises';
import { createConfigLoader } from './config/loader';
import { createEventLogger } from './services/logger';
import { createDiscordQueue } from './services/discordQueue';
import { AuthService } from './services/auth';
import { registerPublicRoutes, registerAPIRoutes } from './routes';

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

  // Health check (toujours accessible)
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Routes publiques (sans préfixe) pour le serveur de jeu
  await registerPublicRoutes(fastify, {
    configLoader,
    eventLogger,
    discordQueue
  });

  // Routes API (avec préfixe /api) pour l'interface admin
  await fastify.register(async function (fastify) {
    await registerAPIRoutes(fastify, {
      configLoader,
      eventLogger,
      discordQueue,
      authService
    });
  }, { prefix: '/api' });

  // Register static files serving
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/',
    decorateReply: false
  });

  // Fallback pour les routes React (SPA routing)
  fastify.setNotFoundHandler(async (request, reply) => {
    // Si c'est une requête API, retourner 404 JSON
    if (request.url.startsWith('/api/')) {
      reply.code(404).send({ error: 'API endpoint not found' });
      return;
    }

    // Si c'est une requête pour un fichier statique (avec extension), 404 normal
    if (request.url.includes('.') && !request.url.endsWith('/')) {
      reply.code(404).send('File not found');
      return;
    }

    // Pour toutes les autres routes (routes React), servir index.html
    try {
      const indexPath = path.join(__dirname, '../public/index.html');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      return reply.type('text/html').send(indexContent);
    } catch (error) {
      console.error('[Fallback] Error serving index.html:', error);
      reply.code(500).send('Internal server error');
    }
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