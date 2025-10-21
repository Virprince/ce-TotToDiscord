"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARSERS = void 0;
exports.parseParams = parseParams;
/**
 * Parse les paramètres pour RR_ABILITY_USE
 * Format attendu: "action|target (result)"
 * Exemple: "Pickpocket|Aliana (Success)"
 */
function parseRRAbilityUse(params) {
    const match = params.match(/^(.+?)\|(.+?)\s*\((.+?)\)$/);
    if (!match) {
        console.warn(`[Parser] Failed to parse RR_ABILITY_USE params: ${params}`);
        return null;
    }
    const result = match[3].trim();
    if (result !== "Success" && result !== "Failure") {
        console.warn(`[Parser] Invalid result value in RR_ABILITY_USE: ${result}`);
        return null;
    }
    return {
        type: "RR_ABILITY_USE",
        action: match[1].trim(),
        target: match[2].trim(),
        result: result
    };
}
/**
 * Parse les paramètres pour FlowChartLog
 * Extrait les tags au format [[TAG]]
 * Exemple: "[[CRIME]][[LOG]] Le reste du message"
 */
function parseFlowChartLog(params) {
    const tagMatches = params.match(/\[\[([^\]]+)\]\]/g);
    const tags = tagMatches ? tagMatches.map(t => t.slice(2, -2)) : [];
    return {
        type: "FlowChartLog",
        raw: params,
        tags: tags,
        tagsFormatted: tags.length > 0 ? tags.map(t => `[${t}]`).join(' ') : ''
    };
}
/**
 * Map des parsers par eventId
 */
exports.PARSERS = {
    RR_ABILITY_USE: parseRRAbilityUse,
    FlowChartLog: parseFlowChartLog
};
/**
 * Parse les paramètres selon l'eventId
 */
function parseParams(eventId, params) {
    const parser = exports.PARSERS[eventId];
    if (!parser) {
        return null;
    }
    try {
        return parser(params);
    }
    catch (error) {
        console.error(`[Parser] Error parsing params for ${eventId}:`, error);
        return null;
    }
}
//# sourceMappingURL=parsers.js.map