import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthConfig, JWTPayload } from '../types/auth';

/**
 * Service d'authentification
 */
export class AuthService {
  private config: AuthConfig;
  
  constructor(config: AuthConfig) {
    this.config = config;
  }
  
  /**
   * Vérifie les credentials et génère un token JWT
   */
  async login(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Vérifier le username
      if (username !== this.config.username) {
        return { success: false, error: 'Identifiants incorrects' };
      }
      
      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(password, this.config.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Identifiants incorrects' };
      }
      
      // Générer le token JWT (expire dans 24h)
      const token = jwt.sign(
        { username },
        this.config.jwtSecret,
        { expiresIn: '24h' }
      );
      
      return { success: true, token };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  }
  
  /**
   * Vérifie la validité d'un token JWT
   */
  verifyToken(token: string): { valid: boolean; payload?: JWTPayload } {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret) as JWTPayload;
      return { valid: true, payload };
    } catch (error) {
      return { valid: false };
    }
  }
  
  /**
   * Middleware Fastify pour protéger les routes
   */
  createAuthMiddleware() {
    return async (request: any, reply: any) => {
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

/**
 * Utilitaire pour hasher un mot de passe (à utiliser une seule fois)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}