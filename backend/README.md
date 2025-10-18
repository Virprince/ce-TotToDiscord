# CE - Tot To Discord

Système de tracking d'événements de jeu avec intégration Discord via webhooks.

## Caractéristiques

- **Parsing intelligent** : Analyse automatique des paramètres selon le type d'événement
- **Règles configurables** : Système de règles avec conditions et priorités
- **Multi-webhooks** : Envoi vers plusieurs canaux Discord avec messages personnalisés
- **Surveillance d'entités** : Suivi de joueurs ou personnages spécifiques
- **Logs rotatifs** : Archivage automatique par mois/semaine/jour
- **Rate limiting** : Protection contre le spam Discord
- **Hot-reload** : Modification de la configuration sans redémarrage
- **Protection des identités** : Masquage automatique pour les webhooks publics

## Installation

### Prérequis

- Node.js v20 ou supérieur
- npm ou yarn

### Étapes

1. Cloner le projet :
```bash
git clone <repository-url>
cd ce-tot-to-discord
```

2. Installer les dépendances :
```bash
npm install
```

3. Créer le fichier de configuration :
```bash
cp config.example.json config.json
```

4. Éditer `config.json` et remplacer les URLs de webhooks Discord

5. Créer le dossier de logs :
```bash
mkdir logs
```

## Utilisation

### Mode développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000` avec hot-reload.

### Mode production

```bash
npm run build
npm start
```

## Configuration

### Structure du fichier `config.json`

#### Global

```json
{
  "global": {
    "logDirectory": "./logs",
    "logRotation": "monthly",
    "logDateFormat": "YYYY-MM-DD HH:mm:ss",
    "logMessageTemplate": "[[date]] | [[steamId]] | [[fullIdentity]] | [[eventId]] | [[params]]",
    "discordRateLimit": {
      "requestsPerSecond": 4,
      "maxQueueSize": 1000,
      "onQueueFull": "drop"
    }
  }
}
```

#### Entités surveillées

```json
{
  "watchedEntities": [
    {
      "id": "watch_foo",
      "name": "Personnage FOO",
      "enabled": true,
      "matchType": "charName",
      "value": "FOO",
      "description": "Description optionnelle"
    }
  ]
}
```

Types de correspondance :
- `steamId` : Surveille un joueur (tous ses personnages)
- `charName` : Surveille un personnage spécifique
- `actName` : Surveille un alias/nom d'emprunt

#### Règles

```json
{
  "rules": [
    {
      "id": "crime_tracking",
      "name": "Suivi des crimes",
      "enabled": true,
      "priority": 20,
      "stopPropagation": false,
      "conditions": {
        "eventId": "FlowChartLog",
        "parsed": {
          "tags": {
            "contains": ["CRIME"],
            "matchMode": "any"
          }
        }
      },
      "actions": {
        "log": {
          "enabled": true,
          "fileName": "crimes"
        },
        "discord": [
          {
            "id": "crime_public",
            "webhook": "https://discord.com/...",
            "webhookType": "public",
            "message": "🚨 [[displayName]] a commis un crime !"
          }
        ]
      }
    }
  ]
}
```

### Variables de template

#### Toujours disponibles

- `[[date]]` : Date de l'événement
- `[[eventId]]` : ID de l'événement (ex: FlowChartLog)
- `[[eventType]]` : Type d'événement
- `[[eventCategory]]` : Catégorie d'événement
- `[[params]]` : Paramètres bruts
- `[[displayName]]` : Nom affiché (actName ou charName)

#### Admin uniquement

- `[[charName]]` : Nom du personnage
- `[[actName]]` : Nom d'emprunt/alias
- `[[steamId]]` : ID Steam du joueur
- `[[fullIdentity]]` : "CharName" ou "CharName (alias: ActName)"

#### Données parsées (RR_ABILITY_USE)

- `[[parsed.action]]` : Nom de l'action
- `[[parsed.target]]` : Cible de l'action
- `[[parsed.result]]` : Résultat (Success/Failure)

#### Données parsées (FlowChartLog)

- `[[parsed.tagsFormatted]]` : Tags formatés "[TAG1] [TAG2]"
- `[[parsed.tags.0]]` : Premier tag
- `[[parsed.tags.1]]` : Deuxième tag, etc.

### Conditions

#### Conditions simples

```json
{
  "conditions": {
    "eventId": "FlowChartLog",
    "charName": {
      "equals": "FOO"
    }
  }
}
```

#### Conditions sur chaînes

```json
{
  "charName": {
    "equals": "FOO",
    "in": ["FOO", "BAR"],
    "notIn": ["ADMIN"],
    "contains": "test",
    "notContains": "bot",
    "regex": "^[A-Z]+$"
  }
}
```

#### Conditions sur données parsées

```json
{
  "parsed": {
    "action": {
      "in": ["Pickpocket", "Lockpicking"]
    },
    "result": {
      "in": ["Success"]
    }
  }
}
```

```json
{
  "parsed": {
    "tags": {
      "contains": ["CRIME", "THEFT"],
      "notContains": ["TEST"],
      "matchMode": "any"
    }
  }
}
```

#### Conditions logiques

```json
{
  "OR": [
    { "charName": { "equals": "FOO" } },
    { "steamId": { "equals": "123456" } }
  ]
}
```

```json
{
  "AND": [
    { "eventId": "FlowChartLog" },
    { "parsed": { "tags": { "contains": ["CRIME"] } } }
  ]
}
```

```json
{
  "NOT": {
    "charName": { "contains": "Admin" }
  }
}
```

#### Entités surveillées

```json
{
  "watchedEntity": {
    "anyOf": ["watch_foo", "watch_bar"]
  }
}
```

## API REST

### Événements

#### GET /log

Reçoit un événement de type log.

Query params :
- `date` : Date de l'événement
- `steamId` : Steam ID du joueur
- `charName` : Nom du personnage
- `actName` : Nom d'emprunt (optionnel)
- `eventId` : ID de l'événement
- `eventCategory` : Catégorie
- `eventType` : Type
- `params` : Paramètres

#### GET /message

Reçoit un événement de type message (même format que /log).

### Configuration

#### GET /config

Récupère la configuration actuelle.

#### PUT /config

Met à jour la configuration.

Body : Configuration complète au format JSON.

#### POST /config/validate

Valide une configuration sans la sauvegarder.

Body : Configuration à valider.

Response :
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "field": "rules.xxx.actions.discord.yyy.message",
      "message": "Public webhook uses sensitive variables...",
      "severity": "warning"
    }
  ]
}
```

### Logs

#### GET /logs

Liste les fichiers de log disponibles.

Response :
```json
{
  "files": [
    "2024-10/crimes.log",
    "2024-09/crimes.log"
  ]
}
```

#### GET /logs/:filename

Télécharge un fichier de log.

### Tests

#### POST /test/webhook

Teste un webhook Discord.

Body :
```json
{
  "webhook": "https://discord.com/api/webhooks/...",
  "message": "Test message"
}
```

Response :
```json
{
  "success": true
}
```

#### POST /test/template

Teste un template avec des données d'exemple.

Body :
```json
{
  "template": "[[charName]] a fait [[parsed.action]]",
  "sampleEvent": {
    "date": "2024-10-18 10:00:00",
    "steamId": "123456",
    "charName": "FOO",
    "actName": "",
    "eventId": "RR_ABILITY_USE",
    "eventCategory": "Action",
    "eventType": "Ability",
    "params": "Pickpocket|BAR (Success)"
  },
  "webhookType": "admin"
}
```

Response :
```json
{
  "result": "FOO a fait Pickpocket"
}
```

### Stats

#### GET /stats

Obtient les statistiques de la queue Discord.

Response :
```json
{
  "pending": 0,
  "size": 0,
  "maxSize": 1000,
  "isPaused": false
}
```

### Health

#### GET /health

Vérifie l'état du serveur.

Response :
```json
{
  "status": "ok",
  "timestamp": "2024-10-18T10:00:00.000Z"
}
```

## Exemples d'utilisation

### Exemple 1 : Suivi des crimes avec 3 niveaux

- Canal public : "Un personnage a commis un crime"
- Canal admin : Détails du crime avec identité
- Canal alertes : Ping @here si entité surveillée

Voir `config.json` pour l'implémentation complète.

### Exemple 2 : Surveillance de compétences spécifiques

Détecter l'utilisation de Pickpocket ou Lockpicking et alerter les admins.

### Exemple 3 : Logs de progression

Capturer tous les événements avec tag [[LOG]] pour suivre la progression des joueurs.

## Dépannage

### Les webhooks ne sont pas envoyés

1. Vérifier les URLs des webhooks dans `config.json`
2. Vérifier les logs du serveur
3. Vérifier la queue : `GET /stats`

### La configuration n'est pas rechargée

1. Vérifier la syntaxe JSON avec `POST /config/validate`
2. Vérifier les logs pour les erreurs de validation
3. Redémarrer le serveur si nécessaire

### Les logs ne sont pas créés

1. Vérifier que le dossier `logDirectory` existe
2. Vérifier les permissions d'écriture
3. Vérifier que `log.enabled: true` dans les règles

## Licence

MIT