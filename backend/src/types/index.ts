import type { AuthConfig } from "./auth";

// ===== ÉVÉNEMENTS BRUTS =====

export type RawEvent = {
    date: string;
    steamId: string;
    charName: string;
    actName: string;
    eventId: string;
    eventCategory: string;
    eventType: string;
    params: string;
  };
  
  // ===== ÉVÉNEMENTS NORMALISÉS =====
  
  export type NormalizedEvent = {
    raw: RawEvent;
    normalized: {
      actName: string;
      displayName: string;
      fullIdentity: string;
    };
    parsed: ParsedParams | null;
  };
  
  // ===== DONNÉES PARSÉES =====
  
  export type ParsedParams = 
    | RRAbilityUseParams
    | FlowChartLogParams;
  
  export type RRAbilityUseParams = {
    type: "RR_ABILITY_USE";
    action: string;
    target: string;
    result: "Success" | "Failure";
  };
  
  export type FlowChartLogParams = {
    type: "FlowChartLog";
    raw: string;
    tags: string[];
    tagsFormatted: string;
  };
  
  // ===== SURVEILLANCE =====
  
  export type WatchedEntity = {
    id: string;
    name: string;
    enabled: boolean;
    matchType: "steamId" | "charName" | "actName";
    value: string;
    description?: string;
    createdAt: string;
  };
  
  // ===== CONDITIONS =====
  
  export type RuleConditions = {
    eventId?: string;
    eventType?: string;
    eventCategory?: string;
    
    steamId?: StringCondition;
    charName?: StringCondition;
    actName?: StringCondition;
    
    watchedEntity?: {
      anyOf?: string[];
      allOf?: string[];
      noneOf?: string[];
    };
    
    parsed?: {
      action?: StringCondition;
      target?: StringCondition;
      result?: { in?: ("Success" | "Failure")[] };
      
      tags?: {
        contains?: string[];
        notContains?: string[];
        matchMode?: "any" | "all";
      };
    };
    
    AND?: RuleConditions[];
    OR?: RuleConditions[];
    NOT?: RuleConditions;
  };
  
  export type StringCondition = {
    equals?: string;
    in?: string[];
    notIn?: string[];
    contains?: string;
    notContains?: string;
    regex?: string;
  };
  
  // ===== ACTIONS =====
  
  export type RuleActions = {
    log?: {
      enabled: boolean;
      fileName: string;
      message?: string;
    };
    discord?: DiscordWebhook[];
  };
  
  export type DiscordWebhook = {
    id: string;
    webhook: string;
    webhookType?: "public" | "admin";
    message: string;
    allowMentions?: boolean;
    conditions?: RuleConditions;
  };
  
  // ===== RÈGLES =====
  
  export type Rule = {
    id: string;
    name: string;
    enabled: boolean;
    priority: number;
    stopPropagation: boolean;
    allowDuplicates?: boolean;
    conditions: RuleConditions;
    actions: RuleActions;
  };
  
  // ===== CONFIGURATION =====
  
  export type Config = {
    meta: {
      version: string;
      lastModified: string;
    };
    auth: AuthConfig;
    global: {
      logDirectory: string;
      logRotation: "monthly" | "weekly" | "daily";
      logDateFormat: string;
      logMessageTemplate: string;
      discordRateLimit: {
        requestsPerSecond: number;
        maxQueueSize: number;
        onQueueFull: "drop" | "wait";
      };
    };
    watchedEntities: WatchedEntity[];
    rules: Rule[];
  };
  
  // ===== RÉSULTATS D'ÉVALUATION =====
  
  export type MatchResult = {
    matches: boolean;
    matchedEntityIds: string[];
  };
  
  export type RuleMatch = {
    rule: Rule;
    matchedEntities: string[];
  };
  
  export type ExecutionPlan = {
    event: NormalizedEvent;
    logActions: Array<{
      fileName: string;
      message: string;
    }>;
    discordActions: Array<{
      webhook: string;
      message: string;
      allowMentions: boolean;
      ruleId: string;
      webhookId: string;
    }>;
  };
  
  // ===== VALIDATION =====
  
  export type ValidationError = {
    field: string;
    message: string;
    severity: "error" | "warning";
  };
  
  export type ValidationResult = {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
  };

