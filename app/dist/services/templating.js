"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceVariables = replaceVariables;
exports.extractVariables = extractVariables;
exports.validateTemplateForPublic = validateTemplateForPublic;
/**
 * Remplace les variables dans un template
 */
function replaceVariables(template, event, webhookType) {
    const variables = buildVariables(event, webhookType);
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `[[${key}]]`;
        result = result.replaceAll(placeholder, String(value));
    }
    return result;
}
/**
 * Construit le dictionnaire de variables disponibles
 */
function buildVariables(event, webhookType) {
    const vars = {
        date: event.raw.date ?? new Date().toISOString(),
        eventId: event.raw.eventId,
        eventType: event.raw.eventType,
        eventCategory: event.raw.eventCategory,
        params: event.raw.params,
        displayName: event.normalized.displayName
    };
    if (webhookType === 'admin') {
        vars.charName = event.raw.charName;
        vars.actName = event.raw.actName;
        vars.steamId = event.raw.steamId;
        vars.fullIdentity = event.normalized.fullIdentity;
    }
    if (event.parsed) {
        if (event.parsed.type === "RR_ABILITY_USE") {
            vars['parsed.action'] = event.parsed.action;
            vars['parsed.target'] = event.parsed.target;
            vars['parsed.result'] = event.parsed.result;
        }
        else if (event.parsed.type === "FlowChartLog") {
            vars['parsed.tagsFormatted'] = event.parsed.tagsFormatted;
            event.parsed.tags.forEach((tag, index) => {
                vars[`parsed.tags.${index}`] = tag;
            });
        }
    }
    return vars;
}
/**
 * Détecte les variables utilisées dans un template
 */
function extractVariables(template) {
    const regex = /\[\[([^\]]+)\]\]/g;
    const matches = template.matchAll(regex);
    return Array.from(matches, m => m[1]);
}
/**
 * Valide qu'un template n'utilise pas de variables sensibles pour un webhook public
 */
function validateTemplateForPublic(template) {
    const sensitiveVars = ['charName', 'steamId', 'actName', 'fullIdentity'];
    const usedVars = extractVariables(template);
    return usedVars.filter(v => sensitiveVars.includes(v));
}
//# sourceMappingURL=templating.js.map