"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPublicRoutes = registerPublicRoutes;
exports.registerAPIRoutes = registerAPIRoutes;
const normalizer_1 = require("../services/normalizer");
const ruleEngine_1 = require("../services/ruleEngine");
const templating_1 = require("../services/templating");
const logger_1 = require("../services/logger");
const validator_1 = require("../config/validator");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// ===== ROUTES PUBLIQUES (sans préfixe) =====
async function registerPublicRoutes(fastify, { configLoader, eventLogger, discordQueue }) {
    // Routes d'événements pour le serveur de jeu
    fastify.get('/log', async (request, reply) => {
        try {
            const rawEvent = (0, normalizer_1.parseEventFromQuery)(request.query);
            const event = (0, normalizer_1.normalizeEvent)(rawEvent);
            console.log('[Event] Received log event:', {
                eventId: event.raw.eventId,
                charName: event.raw.charName,
                actName: event.normalized.actName
            });
            const config = configLoader.get();
            const plan = (0, ruleEngine_1.evaluateEvent)(event, config);
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
        }
        catch (error) {
            console.error('[Event] Error processing log event:', error);
            reply.code(500).send({
                success: false,
                error: String(error)
            });
        }
    });
    fastify.get('/message', async (request, reply) => {
        try {
            const rawEvent = (0, normalizer_1.parseEventFromQuery)(request.query);
            const event = (0, normalizer_1.normalizeEvent)(rawEvent);
            console.log('[Event] Received message event:', {
                eventId: event.raw.eventId,
                charName: event.raw.charName,
                actName: event.normalized.actName
            });
            const config = configLoader.get();
            const plan = (0, ruleEngine_1.evaluateEvent)(event, config);
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
        }
        catch (error) {
            console.error('[Event] Error processing message event:', error);
            reply.code(500).send({
                success: false,
                error: String(error)
            });
        }
    });
}
// ===== ROUTES API (avec préfixe /api) =====
async function registerAPIRoutes(fastify, { configLoader, eventLogger, discordQueue, authService }) {
    // ===== ROUTES NON PROTÉGÉES =====
    // Health check pour l'interface admin
    fastify.get('/health', async (request, reply) => {
        reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // Routes d'authentification
    fastify.post('/auth/login', async (request, reply) => {
        console.log('[AUTH] Login route called directly');
        try {
            const { username, password } = request.body;
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
        }
        catch (error) {
            console.error('[AUTH] Login error:', error);
            reply.code(500).send({ error: String(error) });
        }
    });
    fastify.get('/auth/verify', {
        preHandler: authService.createAuthMiddleware()
    }, async (request, reply) => {
        reply.send({ valid: true, user: request.user });
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
            }
            catch (error) {
                reply.code(500).send({ error: String(error) });
            }
        });
        fastify.put('/config', async (request, reply) => {
            try {
                const newConfig = request.body;
                const validation = (0, validator_1.validateConfig)(newConfig);
                if (!validation.valid) {
                    reply.code(400).send({
                        error: 'Configuration invalide',
                        errors: validation.errors
                    });
                    return;
                }
                await configLoader.save(newConfig);
                reply.send({ success: true });
            }
            catch (error) {
                reply.code(500).send({ error: String(error) });
            }
        });
        fastify.post('/config/validate', async (request, reply) => {
            try {
                const config = request.body;
                const validation = (0, validator_1.validateConfig)(config);
                reply.send(validation);
            }
            catch (error) {
                reply.code(500).send({ error: String(error) });
            }
        });
        // Routes de logs
        fastify.get('/logs', async (request, reply) => {
            try {
                const config = configLoader.get();
                const files = await (0, logger_1.listLogFiles)(config.global.logDirectory || './logs');
                reply.send({ files });
            }
            catch (error) {
                reply.code(500).send({ error: String(error) });
            }
        });
        fastify.get('/logs/:filename', async (request, reply) => {
            try {
                const { filename } = request.params;
                const config = configLoader.get();
                const logDir = config.global.logDirectory || './logs';
                if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                    reply.code(400).send({ error: 'Nom de fichier invalide' });
                    return;
                }
                const filePath = path_1.default.join(logDir, filename);
                try {
                    await promises_1.default.access(filePath);
                    reply.type('text/plain').sendFile(filename, logDir);
                }
                catch {
                    reply.code(404).send({ error: 'Fichier non trouvé' });
                }
            }
            catch (error) {
                reply.code(500).send({ error: String(error) });
            }
        });
        // Routes de test
        fastify.post('/test/webhook', async (request, reply) => {
            try {
                const { webhook, message } = request.body;
                if (!webhook || !message) {
                    reply.code(400).send({ error: 'webhook et message requis' });
                    return;
                }
                await discordQueue.testWebhook(webhook, message);
                reply.send({ success: true });
            }
            catch (error) {
                reply.code(500).send({
                    success: false,
                    error: String(error)
                });
            }
        });
        fastify.post('/test/template', async (request, reply) => {
            try {
                const { template, sampleEvent, webhookType = 'admin' } = request.body;
                if (!template || !sampleEvent) {
                    reply.code(400).send({ error: 'template et sampleEvent requis' });
                    return;
                }
                const rawEvent = (0, normalizer_1.parseEventFromQuery)(sampleEvent);
                const event = (0, normalizer_1.normalizeEvent)(rawEvent);
                const result = (0, templating_1.replaceVariables)(template, event, webhookType);
                reply.send({ result });
            }
            catch (error) {
                reply.code(500).send({ error: String(error) });
            }
        });
        // Routes de stats
        fastify.get('/stats', async (request, reply) => {
            try {
                const stats = discordQueue.getStats();
                reply.send(stats);
            }
            catch (error) {
                reply.code(500).send({ error: String(error) });
            }
        });
    });
}
//# sourceMappingURL=index.js.map