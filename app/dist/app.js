"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const loader_1 = require("./config/loader");
const logger_1 = require("./services/logger");
const discordQueue_1 = require("./services/discordQueue");
const auth_1 = require("./services/auth");
const routes_1 = require("./routes");
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';
async function start() {
    const fastify = (0, fastify_1.default)({
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
    await fastify.register(cors_1.default, {
        origin: true
    });
    console.log('[App] Initializing...');
    const configLoader = (0, loader_1.createConfigLoader)();
    try {
        await configLoader.load();
    }
    catch (error) {
        console.error('[App] Failed to load configuration. Please ensure config.json exists.');
        process.exit(1);
    }
    const config = configLoader.get();
    const eventLogger = (0, logger_1.createEventLogger)(config);
    const discordQueue = (0, discordQueue_1.createDiscordQueue)(config);
    const authService = new auth_1.AuthService({
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
    await (0, routes_1.registerPublicRoutes)(fastify, {
        configLoader,
        eventLogger,
        discordQueue
    });
    // Routes API (avec préfixe /api) pour l'interface admin
    await fastify.register(async function (fastify) {
        await (0, routes_1.registerAPIRoutes)(fastify, {
            configLoader,
            eventLogger,
            discordQueue,
            authService
        });
    }, { prefix: '/api' });
    // Register static files serving
    await fastify.register(static_1.default, {
        root: path_1.default.join(__dirname, '../public'),
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
            const indexPath = path_1.default.join(__dirname, '../public/index.html');
            const indexContent = await promises_1.default.readFile(indexPath, 'utf-8');
            return reply.type('text/html').send(indexContent);
        }
        catch (error) {
            console.error('[Fallback] Error serving index.html:', error);
            reply.code(500).send('Internal server error');
        }
    });
    try {
        await fastify.listen({ port: PORT, host: HOST });
        console.log(`[App] Server listening on http://${HOST}:${PORT}`);
    }
    catch (error) {
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
//# sourceMappingURL=app.js.map