"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
const templating_1 = require("../services/templating");
/**
 * Valide une configuration complète
 */
function validateConfig(config) {
    const errors = [];
    const warnings = [];
    if (!config.meta || !config.meta.version) {
        errors.push({
            field: 'meta.version',
            message: 'Version is required',
            severity: 'error'
        });
    }
    if (!config.global) {
        errors.push({
            field: 'global',
            message: 'Global configuration is required',
            severity: 'error'
        });
        return { valid: false, errors, warnings };
    }
    if (!config.global.logDirectory) {
        errors.push({
            field: 'global.logDirectory',
            message: 'Log directory is required',
            severity: 'error'
        });
    }
    if (!['monthly', 'weekly', 'daily'].includes(config.global.logRotation)) {
        errors.push({
            field: 'global.logRotation',
            message: 'Invalid log rotation value',
            severity: 'error'
        });
    }
    if (config.global.discordRateLimit.requestsPerSecond < 1 || config.global.discordRateLimit.requestsPerSecond > 10) {
        warnings.push({
            field: 'global.discordRateLimit.requestsPerSecond',
            message: 'Discord rate limit should be between 1 and 5 to avoid being rate limited',
            severity: 'warning'
        });
    }
    if (!config.watchedEntities) {
        config.watchedEntities = [];
    }
    const entityIds = new Set();
    for (const entity of config.watchedEntities) {
        if (!entity.id) {
            errors.push({
                field: 'watchedEntities',
                message: 'Watched entity missing id',
                severity: 'error'
            });
            continue;
        }
        if (entityIds.has(entity.id)) {
            errors.push({
                field: `watchedEntities.${entity.id}`,
                message: `Duplicate entity id: ${entity.id}`,
                severity: 'error'
            });
        }
        entityIds.add(entity.id);
        if (!['steamId', 'charName', 'actName'].includes(entity.matchType)) {
            errors.push({
                field: `watchedEntities.${entity.id}.matchType`,
                message: `Invalid match type: ${entity.matchType}`,
                severity: 'error'
            });
        }
        if (!entity.value) {
            errors.push({
                field: `watchedEntities.${entity.id}.value`,
                message: 'Entity value is required',
                severity: 'error'
            });
        }
    }
    if (!config.rules) {
        errors.push({
            field: 'rules',
            message: 'Rules array is required',
            severity: 'error'
        });
        return { valid: errors.length === 0, errors, warnings };
    }
    const ruleIds = new Set();
    for (const rule of config.rules) {
        if (!rule.id) {
            errors.push({
                field: 'rules',
                message: 'Rule missing id',
                severity: 'error'
            });
            continue;
        }
        if (ruleIds.has(rule.id)) {
            errors.push({
                field: `rules.${rule.id}`,
                message: `Duplicate rule id: ${rule.id}`,
                severity: 'error'
            });
        }
        ruleIds.add(rule.id);
        if (!rule.name) {
            warnings.push({
                field: `rules.${rule.id}.name`,
                message: 'Rule should have a name',
                severity: 'warning'
            });
        }
        if (typeof rule.priority !== 'number') {
            errors.push({
                field: `rules.${rule.id}.priority`,
                message: 'Priority must be a number',
                severity: 'error'
            });
        }
        if (!rule.actions || (!rule.actions.log && !rule.actions.discord)) {
            errors.push({
                field: `rules.${rule.id}.actions`,
                message: 'Rule must have at least one action (log or discord)',
                severity: 'error'
            });
        }
        if (rule.actions.discord) {
            const webhookIds = new Set();
            for (const webhook of rule.actions.discord) {
                if (!webhook.id) {
                    errors.push({
                        field: `rules.${rule.id}.actions.discord`,
                        message: 'Webhook missing id',
                        severity: 'error'
                    });
                    continue;
                }
                if (webhookIds.has(webhook.id)) {
                    errors.push({
                        field: `rules.${rule.id}.actions.discord.${webhook.id}`,
                        message: `Duplicate webhook id: ${webhook.id}`,
                        severity: 'error'
                    });
                }
                webhookIds.add(webhook.id);
                if (!webhook.webhook) {
                    errors.push({
                        field: `rules.${rule.id}.actions.discord.${webhook.id}.webhook`,
                        message: 'Webhook URL is required',
                        severity: 'error'
                    });
                }
                else if (!webhook.webhook.startsWith('https://discord.com/api/webhooks/')) {
                    errors.push({
                        field: `rules.${rule.id}.actions.discord.${webhook.id}.webhook`,
                        message: 'Invalid Discord webhook URL',
                        severity: 'error'
                    });
                }
                if (!webhook.message) {
                    errors.push({
                        field: `rules.${rule.id}.actions.discord.${webhook.id}.message`,
                        message: 'Webhook message is required',
                        severity: 'error'
                    });
                }
                if (webhook.webhookType === 'public') {
                    const sensitiveVars = (0, templating_1.validateTemplateForPublic)(webhook.message);
                    if (sensitiveVars.length > 0) {
                        warnings.push({
                            field: `rules.${rule.id}.actions.discord.${webhook.id}.message`,
                            message: `Public webhook uses sensitive variables: ${sensitiveVars.join(', ')}. Consider using [[displayName]] instead.`,
                            severity: 'warning'
                        });
                    }
                }
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=validator.js.map