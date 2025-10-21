"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateEvent = evaluateEvent;
exports.evaluateTrigger = evaluateTrigger;
exports.evaluateConditions = evaluateConditions;
const templating_1 = require("./templating");
/**
 * Évalue toutes les règles pour un événement
 */
function evaluateEvent(event, config) {
    const matchedRules = [];
    const sortedRules = [...config.rules]
        .filter(r => r.enabled)
        .sort((a, b) => b.priority - a.priority);
    for (const rule of sortedRules) {
        // on regarde si le trigger matche
        const triggerMatch = evaluateTrigger(event, rule.trigger);
        if (triggerMatch.matches) {
            matchedRules.push({
                rule,
                matchedEntities: triggerMatch.matchedEntityIds
            });
            if (rule.stopPropagation) {
                break;
            }
        }
    }
    const dedupedRules = deduplicateRules(matchedRules);
    return buildExecutionPlan(event, dedupedRules, config);
}
// Évalue si l'événement matche le trigger
function evaluateTrigger(event, trigger) {
    if (trigger.eventId && event.raw.eventId !== trigger.eventId) {
        return { matches: false, matchedEntityIds: [] };
    }
    if (trigger.eventType && event.raw.eventType !== trigger.eventType) {
        return { matches: false, matchedEntityIds: [] };
    }
    if (trigger.eventCategory && event.raw.eventCategory !== trigger.eventCategory) {
        return { matches: false, matchedEntityIds: [] };
    }
    return {
        matches: true,
        matchedEntityIds: []
    };
}
/**
 * Évalue les conditions d'une règle
 */
function evaluateConditions(event, conditions, watchedEntities) {
    const matchedEntityIds = [];
    if (conditions.AND) {
        const results = conditions.AND.map(c => evaluateConditions(event, c, watchedEntities));
        const allMatch = results.every(r => r.matches);
        if (!allMatch)
            return { matches: false, matchedEntityIds: [] };
        results.forEach(r => matchedEntityIds.push(...r.matchedEntityIds));
    }
    if (conditions.OR) {
        const results = conditions.OR.map(c => evaluateConditions(event, c, watchedEntities));
        const anyMatch = results.some(r => r.matches);
        if (!anyMatch)
            return { matches: false, matchedEntityIds: [] };
        results.filter(r => r.matches).forEach(r => matchedEntityIds.push(...r.matchedEntityIds));
    }
    if (conditions.NOT) {
        const result = evaluateConditions(event, conditions.NOT, watchedEntities);
        if (result.matches)
            return { matches: false, matchedEntityIds: [] };
    }
    if (conditions.steamId && !matchStringCondition(event.raw.steamId, conditions.steamId)) {
        return { matches: false, matchedEntityIds: [] };
    }
    if (conditions.charName && !matchStringCondition(event.raw.charName, conditions.charName)) {
        return { matches: false, matchedEntityIds: [] };
    }
    if (conditions.actName && !matchStringCondition(event.normalized.actName, conditions.actName)) {
        return { matches: false, matchedEntityIds: [] };
    }
    if (conditions.parsed && event.parsed) {
        if (event.parsed.type === "RR_ABILITY_USE") {
            if (conditions.parsed.action && !matchStringCondition(event.parsed.action, conditions.parsed.action)) {
                return { matches: false, matchedEntityIds: [] };
            }
            if (conditions.parsed.target && !matchStringCondition(event.parsed.target, conditions.parsed.target)) {
                return { matches: false, matchedEntityIds: [] };
            }
            if (conditions.parsed.result?.in && !conditions.parsed.result.in.includes(event.parsed.result)) {
                return { matches: false, matchedEntityIds: [] };
            }
        }
        else if (event.parsed.type === "FlowChartLog") {
            if (conditions.parsed.tags) {
                const tagsMatch = matchTagsCondition(event.parsed.tags, conditions.parsed.tags);
                if (!tagsMatch) {
                    return { matches: false, matchedEntityIds: [] };
                }
            }
        }
    }
    if (conditions.watchedEntity) {
        const entityMatch = matchWatchedEntity(event, conditions.watchedEntity, watchedEntities);
        if (!entityMatch.matches) {
            return { matches: false, matchedEntityIds: [] };
        }
        matchedEntityIds.push(...entityMatch.matchedEntityIds);
    }
    return {
        matches: true,
        matchedEntityIds: [...new Set(matchedEntityIds)]
    };
}
/**
 * Vérifie si une string matche une condition
 */
function matchStringCondition(value, condition) {
    if (condition.equals !== undefined && value !== condition.equals) {
        return false;
    }
    if (condition.in && !condition.in.includes(value)) {
        return false;
    }
    if (condition.notIn && condition.notIn.includes(value)) {
        return false;
    }
    if (condition.contains && !value.toLowerCase().includes(condition.contains.toLowerCase())) {
        return false;
    }
    if (condition.notContains && value.toLowerCase().includes(condition.notContains.toLowerCase())) {
        return false;
    }
    if (condition.regex) {
        const regex = new RegExp(condition.regex);
        if (!regex.test(value)) {
            return false;
        }
    }
    return true;
}
/**
 * Vérifie si les tags matchent une condition
 */
function matchTagsCondition(tags, condition) {
    if (!condition)
        return true;
    if (condition.contains) {
        const matchMode = condition.matchMode || 'any';
        if (matchMode === 'any') {
            const hasAny = condition.contains.some(tag => tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
            if (!hasAny)
                return false;
        }
        else {
            const hasAll = condition.contains.every(tag => tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
            if (!hasAll)
                return false;
        }
    }
    if (condition.notContains) {
        const hasAny = condition.notContains.some(tag => tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
        if (hasAny)
            return false;
    }
    return true;
}
/**
 * Vérifie si l'événement matche une entité surveillée
 */
function matchWatchedEntity(event, condition, entities) {
    const activeEntities = entities.filter(e => e.enabled);
    const matches = activeEntities.filter(entity => {
        switch (entity.matchType) {
            case "steamId":
                return event.raw.steamId === entity.value;
            case "charName":
                return event.raw.charName === entity.value;
            case "actName":
                return event.normalized.actName === entity.value;
            default:
                return false;
        }
    });
    const matchedIds = matches.map(m => m.id);
    if (condition.anyOf) {
        const hasAny = condition.anyOf.some(id => matchedIds.includes(id));
        if (!hasAny)
            return { matches: false, matchedEntityIds: [] };
    }
    if (condition.allOf) {
        const hasAll = condition.allOf.every(id => matchedIds.includes(id));
        if (!hasAll)
            return { matches: false, matchedEntityIds: [] };
    }
    if (condition.noneOf) {
        const hasAny = condition.noneOf.some(id => matchedIds.includes(id));
        if (hasAny)
            return { matches: false, matchedEntityIds: [] };
    }
    return { matches: true, matchedEntityIds: matchedIds };
}
/**
 * Déduplique les règles matchées
 */
function deduplicateRules(matchedRules) {
    const seen = new Set();
    const result = [];
    for (const item of matchedRules) {
        if (item.rule.allowDuplicates || !seen.has(item.rule.id)) {
            result.push(item);
            seen.add(item.rule.id);
        }
    }
    return result;
}
/**
 * Construit le plan d'exécution
 */
function buildExecutionPlan(event, matchedRules, config) {
    const logActions = [];
    const discordActions = [];
    for (const { rule, matchedEntities } of matchedRules) {
        // on ajoute les actions de log
        if (rule.actions.log?.enabled) {
            const message = rule.actions.log.message || config.global.logMessageTemplate;
            logActions.push({
                fileName: rule.actions.log.fileName,
                message: (0, templating_1.replaceVariables)(message, event, 'admin')
            });
        }
        // on ajoute les actions de discord
        if (rule.actions.discord) {
            for (const webhook of rule.actions.discord) {
                // on évalue les conditions du webhook
                if (webhook.conditions) {
                    const condResult = evaluateConditions(event, webhook.conditions, config.watchedEntities);
                    if (!condResult.matches) {
                        continue;
                    }
                }
                discordActions.push({
                    webhook: webhook.webhook,
                    message: (0, templating_1.replaceVariables)(webhook.message, event, webhook.webhookType || 'admin'),
                    allowMentions: webhook.allowMentions || false,
                    ruleId: rule.id,
                    webhookId: webhook.id
                });
            }
        }
    }
    return {
        event,
        logActions,
        discordActions
    };
}
//# sourceMappingURL=ruleEngine.js.map