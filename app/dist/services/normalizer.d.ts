import { RawEvent, NormalizedEvent } from '../types';
/**
 * Normalise un événement brut en ajoutant des champs dérivés
 */
export declare function normalizeEvent(raw: RawEvent): NormalizedEvent;
/**
 * Parse une requête URL en RawEvent
 */
export declare function parseEventFromQuery(query: Record<string, any>): RawEvent;
//# sourceMappingURL=normalizer.d.ts.map