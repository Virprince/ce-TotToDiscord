// Types synchronisés avec le backend

export type WatchedEntity = {
    id: string;
    name: string;
    enabled: boolean;
    matchType: "steamId" | "charName" | "actName";
    value: string;
    description?: string;
    createdAt: string;
  };
  
  export type StringCondition = {
    equals?: string;
    in?: string[];
    notIn?: string[];
    contains?: string;
    notContains?: string;
    regex?: string;
  };
  
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
  
  export type DiscordWebhook = {
    id: string;
    webhook: string;
    webhookType?: "public" | "admin";
    message: string;
    allowMentions?: boolean;
    conditions?: RuleConditions;
  };
  
  export type RuleActions = {
    log?: {
      enabled: boolean;
      fileName: string;
      message?: string;
    };
    discord?: DiscordWebhook[];
  };
  
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
  
  export type Config = {
    meta: {
      version: string;
      lastModified: string;
    };
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
  
  export type QueueStats = {
    pending: number;
    size: number;
    maxSize: number;
    isPaused: boolean;
  };