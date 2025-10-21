import { Config, NormalizedEvent, RuleTrigger, RuleConditions, MatchResult, ExecutionPlan, WatchedEntity } from '../types';
/**
 * Évalue toutes les règles pour un événement
 */
export declare function evaluateEvent(event: NormalizedEvent, config: Config): ExecutionPlan;
export declare function evaluateTrigger(event: NormalizedEvent, trigger: RuleTrigger): MatchResult;
/**
 * Évalue les conditions d'une règle
 */
export declare function evaluateConditions(event: NormalizedEvent, conditions: RuleConditions, watchedEntities: WatchedEntity[]): MatchResult;
//# sourceMappingURL=ruleEngine.d.ts.map