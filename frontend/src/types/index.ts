// Types synchronisés avec le backend

// ===== ENTITÉS SURVEILLÉES =====
export type WatchedEntity = {
    id: string;
    name: string;
    enabled: boolean;
    matchType: "steamId" | "charName" | "actName";
    value: string;
    description?: string;
    createdAt: string;
  };
  
  // ===== CONDITIONS DE TYPE STRING =====
  export type StringCondition = {
    equals?: string;
    in?: string[];
    notIn?: string[];
    contains?: string;
    notContains?: string;
    regex?: string;
  };
  
  // ===== DÉCLENCHEURS =====
  export type RuleTrigger = {
    eventId?: string;
    eventType?: string;
    eventCategory?: string;
    parsed?: ParsedParams;
  };

  // ===== PARAMÈTRES PARSÉS =====
  export type ParsedParams = {
    action?: StringCondition;
    target?: StringCondition;
    result?: { in?: ("Success" | "Failure")[] };
    tags?: {
      contains?: string[];
      notContains?: string[];
      matchMode?: "any" | "all";
    };
  };

  // ===== CONDITIONS LOGIQUES =====
  export type RuleConditions = {
    
    steamId?: StringCondition;
    charName?: StringCondition;
    actName?: StringCondition;
    
    watchedEntity?: {
      anyOf?: string[];
      allOf?: string[];
      noneOf?: string[];
    };
    
    parsed?: ParsedParams;
    
    AND?: RuleConditions[];
    OR?: RuleConditions[];
    NOT?: RuleConditions;
  };
  
  // ===== WEBHOOK =====
  export type DiscordWebhook = {
    id: string;
    name: string;
    webhook: string;
    webhookType?: "public" | "admin";
    message: string;
    allowMentions?: boolean;
    conditions?: RuleConditions;
  };
  
  // ===== ACTIONS DE RÈGLE =====
  export type RuleActions = {
    log?: {
      enabled: boolean;
      fileName: string;
      message?: string;
    };
    discord?: DiscordWebhook[];
  };
  
  // ===== RÈGLE =====
  export type Rule = {
    id: string;
    name: string;
    enabled: boolean;
    priority: number;
    stopPropagation: boolean;
    allowDuplicates?: boolean;
    trigger: RuleTrigger;
    actions: RuleActions;
  };
  
  // ===== CONFIGURATION =====
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
  
  // ===== ERREUR DE VALIDATION =====
  export type ValidationError = {
    field: string;
    message: string;
    severity: "error" | "warning";
  };
  
  // ===== RÉSULTAT DE VALIDATION =====
  export type ValidationResult = {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
  };
  
  // ===== STATISTIQUES DE LA FILE D'ATTENTE =====
  export type QueueStats = {
    pending: number;
    size: number;
    maxSize: number;
    isPaused: boolean;
  };