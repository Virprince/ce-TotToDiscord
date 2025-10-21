import { AuthConfig, JWTPayload } from '../types/auth';
/**
 * Service d'authentification
 */
export declare class AuthService {
    private config;
    constructor(config: AuthConfig);
    /**
     * Vérifie les credentials et génère un token JWT
     */
    login(username: string, password: string): Promise<{
        success: boolean;
        token?: string;
        error?: string;
    }>;
    /**
     * Vérifie la validité d'un token JWT
     */
    verifyToken(token: string): {
        valid: boolean;
        payload?: JWTPayload;
    };
    /**
     * Middleware Fastify pour protéger les routes
     */
    createAuthMiddleware(): (request: any, reply: any) => Promise<void>;
}
/**
 * Utilitaire pour hasher un mot de passe (à utiliser une seule fois)
 */
export declare function hashPassword(password: string): Promise<string>;
//# sourceMappingURL=auth.d.ts.map