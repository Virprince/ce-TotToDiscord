import { NormalizedEvent } from '../types';

/**
 * Remplace les variables dans un template
 */
export function replaceVariables(
  template: string,
  event: NormalizedEvent,
  webhookType: 'public' | 'admin'
): string {
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
function buildVariables(
  event: NormalizedEvent,
  webhookType: 'public' | 'admin'
): Record<string, string | number> {
  const vars: Record<string, string | number> = {
    date: event.raw.date,
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
    } else if (event.parsed.type === "FlowChartLog") {
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
export function extractVariables(template: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches = template.matchAll(regex);
  return Array.from(matches, m => m[1]);
}

/**
 * Valide qu'un template n'utilise pas de variables sensibles pour un webhook public
 */
export function validateTemplateForPublic(template: string): string[] {
  const sensitiveVars = ['charName', 'steamId', 'actName', 'fullIdentity'];
  const usedVars = extractVariables(template);
  
  return usedVars.filter(v => sensitiveVars.includes(v));
}