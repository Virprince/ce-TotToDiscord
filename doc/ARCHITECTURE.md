# Architecture du système

## Vue d'ensemble

Le système est construit en TypeScript avec Node.js et utilise Fastify comme framework web. Il reçoit des événements depuis un serveur de jeu, les traite selon des règles configurables, et les envoie vers Discord et/ou les log dans des fichiers.

## Flux de données

```
Serveur de jeu
    ↓
GET /log ou /message (avec query params)
    ↓
parseEventFromQuery() → RawEvent
    ↓
normalizeEvent() → NormalizedEvent
    ↓
parseParams() → ParsedParams
    ↓
evaluateEvent() → ExecutionPlan
    ↓
    ├→ eventLogger.log() → Fichiers logs rotatifs
    └→ discordQueue.sendMessage() → Discord webhooks
```

## Composants principaux

### 1. Types (types/index.ts)

Définit tous les types TypeScript utilisés dans l'application :
- `RawEvent` : Événement brut reçu du serveur
- `NormalizedEvent` : Événement enrichi avec données dérivées
- `ParsedParams` : Paramètres parsés selon eventId
- `Config` : Structure de configuration
- `Rule` : Définition d'une règle
- etc.

### 2. Parsers (services/parsers.ts)

Parse les paramètres selon le type d'événement :

**RR_ABILITY_USE** :
- Format : `"action|target (result)"`
- Exemple : `"Pickpocket|Aliana (Success)"`
- Extrait : action, target, result

**FlowChartLog** :
- Format : `"[[TAG1]][[TAG2]] texte libre"`
- Exemple : `"[[CRIME]][[THEFT]] Vol de 100 pièces"`
- Extrait : tags array, tagsFormatted

### 3. Normalizer (services/normalizer.ts)

Enrichit les événements bruts :
- `actName` : Normalise avec fallback sur charName
- `displayName` : Nom à afficher publiquement
- `fullIdentity` : Format "CharName" ou "CharName (alias: ActName)"

### 4. Rule Engine (services/ruleEngine.ts)

Cœur du système, évalue les règles :

**Processus d'évaluation** :
1. Trie les règles par priorité (descendante)
2. Pour chaque règle activée :
   - Évalue les conditions
   - Si match et stopPropagation=false → continue
   - Si match et stopPropagation=true → stop
3. Déduplique les règles matchées (sauf si allowDuplicates=true)
4. Construit le plan d'exécution

**Types de conditions** :
- Simples : eventId, eventType, etc.
- String conditions : equals, in, notIn, contains, regex
- Parsed conditions : sur données parsées
- Watched entities : sur entités surveillées
- Logiques : AND, OR, NOT

### 5. Templating (services/templating.ts)

Remplace les variables dans les messages :

**Variables standard** (toujours disponibles) :
- date, eventId, eventType, eventCategory, params, displayName

**Variables admin** (selon webhookType) :
- charName, actName, steamId, fullIdentity

**Variables parsées** (selon eventId) :
- parsed.action, parsed.target, parsed.result
- parsed.tagsFormatted, parsed.tags.0, parsed.tags.1, etc.

**Protection** : Détecte l'utilisation de variables sensibles dans webhooks publics (warning).

### 6. Logger (services/logger.ts)

Système de logs avec rotation :

**Caractéristiques** :
- Rotation mensuelle/hebdomadaire/quotidienne
- Organisation par dossiers datés (YYYY-MM/)
- Format : `YYYY-MM-DD HH:mm:ss | message`
- Basé sur Winston + winston-daily-rotate-file

**Structure** :
```
logs/
  2024-10/
    crimes.log
    suspicious_abilities.log
  2024-09/
    crimes.log
```

### 7. Discord Queue (services/discordQueue.ts)

File d'attente avec rate limiting :

**Rate limiting** :
- 4 requêtes/seconde par défaut (configurable)
- Queue max 1000 messages (configurable)
- Action si queue pleine : drop ou wait

**Fonctionnalités** :
- Envoi asynchrone avec p-queue
- Gestion des mentions Discord (@here, @everyone)
- Test de webhooks
- Statistiques en temps réel

### 8. Config Loader (config/loader.ts)

Gestionnaire de configuration :

**Hot-reload** :
- Utilise chokidar pour surveiller config.json
- Recharge automatiquement sans redémarrage
- Notifie les listeners des changements

**Validation** :
- Validation au chargement
- Validation avant sauvegarde
- Erreurs bloquantes vs warnings

### 9. Validator (config/validator.ts)

Valide la configuration :

**Vérifications** :
- Structure globale
- IDs uniques (règles, webhooks, entités)
- URLs de webhooks valides
- Types de données corrects
- Variables sensibles dans webhooks publics (warning)

### 10. Routes (routes/index.ts)

API REST :

**Événements** :
- GET /log : Reçoit événements de type log
- GET /message : Reçoit événements de type message

**Configuration** :
- GET /config : Récupère configuration
- PUT /config : Met à jour configuration
- POST /config/validate : Valide sans sauvegarder

**Logs** :
- GET /logs : Liste fichiers
- GET /logs/:filename : Télécharge fichier

**Tests** :
- POST /test/webhook : Teste webhook Discord
- POST /test/template : Teste template avec données exemple

**Stats** :
- GET /stats : Stats de la queue Discord
- GET /health : Health check

### 11. App (app.ts)

Point d'entrée :
- Initialise Fastify
- Charge configuration
- Crée services (logger, queue, config loader)
- Enregistre routes
- Gère graceful shutdown

## Patterns de conception

### 1. Dependency Injection

Les services sont créés au démarrage et injectés dans les routes :

```typescript
await registerRoutes(fastify, {
  configLoader,
  eventLogger,
  discordQueue
});
```

### 2. Strategy Pattern

Les parsers utilisent un pattern strategy :

```typescript
const PARSERS: Record<string, Parser> = {
  RR_ABILITY_USE: parseRRAbilityUse,
  FlowChartLog: parseFlowChartLog
};
```

### 3. Observer Pattern

Le config loader notifie les listeners des changements :

```typescript
configLoader.onChange((newConfig) => {
  // Réagir au changement
});
```

### 4. Chain of Responsibility

Les règles sont évaluées en chaîne selon priorité avec possibilité de stop.

## Décisions techniques

### Pourquoi Fastify ?

- 2x plus rapide qu'Express
- Meilleur pour high-throughput
- Validation intégrée avec schémas JSON
- Excellent système de plugins

### Pourquoi p-queue ?

- Rate limiting intégré
- Pas besoin de Redis (in-memory)
- Simple à utiliser
- Parfait pour notre volume

### Pourquoi Winston ?

- Standard de l'industrie
- Rotation de logs intégrée
- Formats multiples
- Transports flexibles

### Pourquoi hot-reload ?

- Permet modifications sans downtime
- Critique pour serveur de production
- Feedback immédiat pour admins

## Scalabilité

### Limites actuelles

- In-memory queue (perte si crash)
- Configuration en fichier JSON (pas de CRUD granulaire)
- Pas de persistance des stats

### Évolutions possibles

**Court terme** :
- Ajouter Redis pour queue persistante
- Metrics avec Prometheus
- Health checks avancés

**Moyen terme** :
- Base de données pour configuration (SQLite/PostgreSQL)
- Interface web d'administration
- Historique des modifications de config

**Long terme** :
- Multi-instance avec load balancing
- Clustering Redis pour haute disponibilité
- Système de plugins pour parsers custom

## Sécurité

### Mesures en place

1. **Protection des identités** :
   - Variable displayName pour webhooks publics
   - Warning si variables sensibles détectées

2. **Validation** :
   - Validation stricte de la config
   - URLs de webhooks vérifiées
   - Sanitization des noms de fichiers

3. **Rate limiting** :
   - Protection contre spam Discord
   - Queue limitée en taille

### À améliorer

- Authentification sur API
- HTTPS obligatoire
- Rotation des secrets (webhooks)
- Audit log des modifications de config

## Performance

### Optimisations

1. **Parsers** : Compilation des regex au démarrage
2. **Queue** : Traitement asynchrone non-bloquant
3. **Logs** : Buffer avant écriture (Winston)
4. **Config** : Cache en mémoire

### Benchmarks attendus

- Traitement événement : < 5ms
- Latence Discord : 200-500ms (réseau)
- Capacité : 1000+ événements/min

## Monitoring

### Logs applicatifs

- Winston avec format structuré
- Niveaux : info, warn, error
- Timestamps ISO 8601

### Métriques importantes

- Taille de la queue Discord
- Temps de traitement des événements
- Taux d'erreur des webhooks
- Nombre de règles matchées par événement

### À implémenter

- Prometheus metrics
- Alerting sur queue pleine
- Dashboard Grafana