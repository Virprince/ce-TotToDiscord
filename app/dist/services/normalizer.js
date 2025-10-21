"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEvent = normalizeEvent;
exports.parseEventFromQuery = parseEventFromQuery;
const parsers_1 = require("./parsers");
/**
 * Normalise un événement brut en ajoutant des champs dérivés
 */
function normalizeEvent(raw) {
    const actName = raw.actName || raw.charName;
    const displayName = actName;
    const fullIdentity = raw.actName && raw.actName !== raw.charName
        ? `${raw.charName} (alias: ${raw.actName})`
        : raw.charName;
    const parsed = (0, parsers_1.parseParams)(raw.eventId, raw.params);
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
function parseEventFromQuery(query) {
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
//# sourceMappingURL=normalizer.js.map