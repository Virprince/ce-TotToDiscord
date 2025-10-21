"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.hashPassword = hashPassword;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * Service d'authentification
 */
class AuthService {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Vérifie les credentials et génère un token JWT
     */
    async login(username, password) {
        try {
            // Vérifier le username
            if (username !== this.config.username) {
                return { success: false, error: 'Identifiants incorrects' };
            }
            // Vérifier le mot de passe
            const isValid = await bcrypt_1.default.compare(password, this.config.passwordHash);
            if (!isValid) {
                return { success: false, error: 'Identifiants incorrects' };
            }
            // Générer le token JWT (expire dans 24h)
            const token = jsonwebtoken_1.default.sign({ username }, this.config.jwtSecret, { expiresIn: '24h' });
            return { success: true, token };
        }
        catch (error) {
            console.error('[Auth] Login error:', error);
            return { success: false, error: 'Erreur lors de la connexion' };
        }
    }
    /**
     * Vérifie la validité d'un token JWT
     */
    verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.config.jwtSecret);
            return { valid: true, payload };
        }
        catch (error) {
            return { valid: false };
        }
    }
    /**
     * Middleware Fastify pour protéger les routes
     */
    createAuthMiddleware() {
        return async (request, reply) => {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                reply.code(401).send({ error: 'Token manquant' });
                return;
            }
            const token = authHeader.substring(7);
            const { valid, payload } = this.verifyToken(token);
            if (!valid) {
                reply.code(401).send({ error: 'Token invalide ou expiré' });
                return;
            }
            // Ajouter les infos utilisateur à la requête
            request.user = payload;
        };
    }
}
exports.AuthService = AuthService;
/**
 * Utilitaire pour hasher un mot de passe (à utiliser une seule fois)
 */
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, 10);
}
//# sourceMappingURL=auth.js.map