import { FastifyInstance } from 'fastify';
import { parseEventFromQuery, normalizeEvent } from '../services/normalizer';
import { evaluateEvent } from '../services/ruleEngine';
import { replaceVariables } from '../services/templating';
import { listLogFiles } from '../services/logger';
import { validateConfig } from '../config/validator';
import fs from 'fs/promises';
import path from 'path';

// ===== ROUTES PUBLIQUES (sans préfixe) =====
export async function registerPublicRoutes(
  fastify: FastifyInstance,
  { configLoader, eventLogger, discordQueue }: any
) {

  // Routes d'événements pour le serveur de jeu
  fastify.get('/log', async (request, reply) => {
    try {
      const rawEvent = parseEventFromQuery(request.query as any);
      const event = normalizeEvent(rawEvent);

      console.log('[Event] Received log event:', {
        eventId: event.raw.eventId,
        charName: event.raw.charName,
        actName: event.normalized.actName
      });

      const config = configLoader.get();
      const plan = evaluateEvent(event, config);

      for (const logAction of plan.logActions) {
        eventLogger.log(logAction.fileName, logAction.message);
      }

      for (const discordAction of plan.discordActions) {
        await discordQueue.sendMessage(discordAction);
      }

      reply.code(200).send({
        success: true,
        matchedRules: plan.logActions.length + plan.discordActions.length
      });
    } catch (error) {
      console.error('[Event] Error processing log event:', error);
      reply.code(500).send({
        success: false,
        error: String(error)
      });
    }
  });

  fastify.get('/message', async (request, reply) => {
    try {
      const rawEvent = parseEventFromQuery(request.query as any);
      const event = normalizeEvent(rawEvent);

      console.log('[Event] Received message event:', {
        eventId: event.raw.eventId,
        charName: event.raw.charName,
        actName: event.normalized.actName
      });

      const config = configLoader.get();
      const plan = evaluateEvent(event, config);

      for (const logAction of plan.logActions) {
        eventLogger.log(logAction.fileName, logAction.message);
      }

      for (const discordAction of plan.discordActions) {
        await discordQueue.sendMessage(discordAction);
      }

      reply.code(200).send({
        success: true,
        matchedRules: plan.logActions.length + plan.discordActions.length
      });
    } catch (error) {
      console.error('[Event] Error processing message event:', error);
      reply.code(500).send({
        success: false,
        error: String(error)
      });
    }
  });
}

// ===== ROUTES API (avec préfixe /api) =====
export async function registerAPIRoutes(
  fastify: FastifyInstance,
  { configLoader, eventLogger, discordQueue, authService }: any
) {

  // ===== ROUTES NON PROTÉGÉES =====

  // Health check pour l'interface admin
  fastify.get('/health', async (request, reply) => {
    reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes d'authentification
  fastify.post('/auth/login', async (request, reply) => {
    console.log('[AUTH] Login route called directly');
    try {
      const { username, password } = request.body as any;

      if (!username || !password) {
        reply.code(400).send({ error: 'Username et password requis' });
        return;
      }

      console.log('[AUTH] Attempting login for username:', username);
      const result = await authService.login(username, password);

      if (!result.success) {
        reply.code(401).send({ error: result.error });
        return;
      }

      reply.send({ token: result.token });
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      reply.code(500).send({ error: String(error) });
    }
  });

  fastify.get('/auth/verify', {
    preHandler: authService.createAuthMiddleware()
  }, async (request, reply) => {
    reply.send({ valid: true, user: (request as any).user });
  });

  // ===== ROUTES PROTÉGÉES =====
  await fastify.register(async function protectedRoutes(fastify) {
    // Middleware pour protéger TOUTES les routes de ce plugin
    fastify.addHook('preHandler', async (request, reply) => {
      console.log('[MIDDLEWARE] Protecting route:', request.url);
      await authService.createAuthMiddleware()(request, reply);
    });

    // Routes de configuration
    fastify.get('/config', async (request, reply) => {
      try {
        const config = configLoader.get();
        reply.send(config);
      } catch (error) {
        reply.code(500).send({ error: String(error) });
      }
    });

    fastify.put('/config', async (request, reply) => {
      try {
        const newConfig = request.body as any;

        const validation = validateConfig(newConfig);
        if (!validation.valid) {
          reply.code(400).send({
            error: 'Configuration invalide',
            errors: validation.errors
          });
          return;
        }

        await configLoader.save(newConfig);
        reply.send({ success: true });
      } catch (error) {
        reply.code(500).send({ error: String(error) });
      }
    });

    fastify.post('/config/validate', async (request, reply) => {
      try {
        const config = request.body as any;
        const validation = validateConfig(config);
        reply.send(validation);
      } catch (error) {
        reply.code(500).send({ error: String(error) });
      }
    });

    // Routes de logs
    fastify.get('/logs', async (request, reply) => {
      try {
        const config = configLoader.get();
        const files = await listLogFiles(config.global.logDirectory || './logs');
        reply.send({ files });
      } catch (error) {
        reply.code(500).send({ error: String(error) });
      }
    });

    fastify.get('/logs/:filename', async (request, reply) => {
      try {
        const { filename } = request.params as { filename: string };
        const config = configLoader.get();
        const logDir = config.global.logDirectory || './logs';

        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
          reply.code(400).send({ error: 'Nom de fichier invalide' });
          return;
        }

        const filePath = path.join(logDir, filename);

        try {
          await fs.access(filePath);
          reply.type('text/plain').sendFile(filename, logDir);
        } catch {
          reply.code(404).send({ error: 'Fichier non trouvé' });
        }
      } catch (error) {
        reply.code(500).send({ error: String(error) });
      }
    });

    // Routes de test
    fastify.post('/test/webhook', async (request, reply) => {
      try {
        const { webhook, message } = request.body as any;

        if (!webhook || !message) {
          reply.code(400).send({ error: 'webhook et message requis' });
          return;
        }

        await discordQueue.testWebhook(webhook, message);
        reply.send({ success: true });
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: String(error)
        });
      }
    });

    fastify.post('/test/template', async (request, reply) => {
      try {
        const { template, sampleEvent, webhookType = 'admin' } = request.body as any;

        if (!template || !sampleEvent) {
          reply.code(400).send({ error: 'template et sampleEvent requis' });
          return;
        }

        const rawEvent = parseEventFromQuery(sampleEvent as any);
        const event = normalizeEvent(rawEvent);

        const result = replaceVariables(template, event, webhookType);
        reply.send({ result });
      } catch (error) {
        reply.code(500).send({ error: String(error) });
      }
    });

    // Routes de stats
    fastify.get('/stats', async (request, reply) => {
      try {
        const stats = discordQueue.getStats();
        reply.send(stats);
      } catch (error) {
        reply.code(500).send({ error: String(error) });
      }
    });
  });
}