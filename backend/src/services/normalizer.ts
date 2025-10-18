import { RawEvent, NormalizedEvent } from '../types';
import { parseParams } from './parsers';

/**
 * Normalise un événement brut en ajoutant des champs dérivés
 */
export function normalizeEvent(raw: RawEvent): NormalizedEvent {
  const actName = raw.actName || raw.charName;
  const displayName = actName;
  
  const fullIdentity = raw.actName && raw.actName !== raw.charName
    ? `${raw.charName} (alias: ${raw.actName})`
    : raw.charName;
  
  const parsed = parseParams(raw.eventId, raw.params);
  
  return {
    raw,
    normalized: {
      actName,
      displayName,
      fullIdentity
    },
    parsed
  };
}

/**
 * Parse une requête URL en RawEvent
 */
export function parseEventFromQuery(query: Record<string, any>): RawEvent {
  return {
    date: query.date || new Date().toISOString(),
    steamId: query.steamId || '',
    charName: query.charName || '',
    actName: query.actName || '',
    eventId: query.eventId || '',
    eventCategory: query.eventCategory || '',
    eventType: query.eventType || '',
    params: query.params || ''
  };
}