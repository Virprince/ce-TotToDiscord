import { FastifyInstance } from 'fastify';
import { parseEventFromQuery, normalizeEvent } from '../services/normalizer';
import { evaluateEvent } from '../services/ruleEngine';
import { replaceVariables } from '../services/templating';
import { listLogFiles } from '../services/logger';
import { validateConfig } from '../config/validator';
import fs from 'fs/promises';
import path from 'path';

export async function registerRoutes(
  fastify: FastifyInstance,
  { configLoader, eventLogger, discordQueue, authService }: any
) {

  // ===== ROUTE DE LOGIN (non protégée) =====
  
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const { username, password } = request.body as any;
      
      if (!username || !password) {
        reply.code(400).send({ error: 'Username et password requis' });
        return;
      }
      
      const result = await authService.login(username, password);
      
      if (!result.success) {
        reply.code(401).send({ error: result.error });
        return;
      }
      
      reply.send({ token: result.token });
    } catch (error) {
      reply.code(500).send({ error: String(error) });
    }
  });
  
  // ===== ROUTE DE VÉRIFICATION TOKEN =====
  
  fastify.get('/auth/verify', {
    preHandler: authService.createAuthMiddleware()
  }, async (request, reply) => {
    reply.send({ valid: true, user: (request as any).user });
  });
  
  // ===== PROTÉGER TOUTES LES AUTRES ROUTES =====
  
  // Middleware global pour toutes les routes sauf /auth/* et /health
  fastify.addHook('preHandler', async (request, reply) => {
    // Routes publiques (ne pas protéger)
    const publicRoutes = ['/auth/login', '/health', '/log', '/message'];
    
    if (publicRoutes.some(route => request.url.startsWith(route))) {
      return;
    }
    
    // Protéger toutes les autres routes
    await authService.createAuthMiddleware()(request, reply);
  });
  
  // ===== ROUTES D'ÉVÉNEMENTS =====
  
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
        charName: event.raw.charName
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
  
  // ===== ROUTES DE CONFIGURATION =====
  
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
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        });
        return;
      }
      
      await configLoader.save(newConfig);
      
      reply.send({
        success: true,
        warnings: validation.warnings
      });
    } catch (error) {
      reply.code(500).send({ 
        success: false, 
        error: String(error) 
      });
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
  
  // ===== ROUTES DE LOGS =====
  
  fastify.get('/logs', async (request, reply) => {
    try {
      const config = configLoader.get();
      const files = await listLogFiles(config.global.logDirectory);
      
      reply.send({ files });
    } catch (error) {
      reply.code(500).send({ error: String(error) });
    }
  });
  
  fastify.get('/logs/:filename', async (request, reply) => {
    try {
      const { filename } = request.params as any;
      const config = configLoader.get();
      
      const safePath = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, '');
      const filePath = path.join(config.global.logDirectory, safePath);
      
      const content = await fs.readFile(filePath, 'utf-8');
      
      reply
        .header('Content-Type', 'text/plain')
        .header('Content-Disposition', `attachment; filename="${path.basename(safePath)}"`)
        .send(content);
    } catch (error) {
      reply.code(404).send({ error: 'Log file not found' });
    }
  });
  
  // ===== ROUTES DE TEST =====
  
  fastify.post('/test/webhook', async (request, reply) => {
    try {
      const { webhook, message } = request.body as any;
      
      if (!webhook || !message) {
        reply.code(400).send({ error: 'webhook and message are required' });
        return;
      }
      
      const result = await discordQueue.testWebhook(webhook, message);
      
      reply.send(result);
    } catch (error) {
      reply.code(500).send({ 
        success: false, 
        error: String(error) 
      });
    }
  });
  
  fastify.post('/test/template', async (request, reply) => {
    try {
      const { template, sampleEvent, webhookType } = request.body as any;
      
      if (!template || !sampleEvent) {
        reply.code(400).send({ error: 'template and sampleEvent are required' });
        return;
      }
      
      const event = normalizeEvent(sampleEvent);
      const result = replaceVariables(template, event, webhookType || 'admin');
      
      reply.send({ result });
    } catch (error) {
      reply.code(500).send({ error: String(error) });
    }
  });
  
  // ===== ROUTES DE STATS =====
  
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = discordQueue.getStats();
      reply.send(stats);
    } catch (error) {
      reply.code(500).send({ error: String(error) });
    }
  });
}