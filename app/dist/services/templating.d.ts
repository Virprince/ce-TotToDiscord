import { NormalizedEvent } from '../types';
/**
 * Remplace les variables dans un template
 */
export declare function replaceVariables(template: string, event: NormalizedEvent, webhookType: 'public' | 'admin'): string;
/**
 * Détecte les variables utilisées dans un template
 */
export declare function extractVariables(template: string): string[];
/**
 * Valide qu'un template n'utilise pas de variables sensibles pour un webhook public
 */
export declare function validateTemplateForPublic(template: string): string[];
//# sourceMappingURL=templating.d.ts.map