# Guide de démarrage rapide

## Installation en 5 minutes

### 1. Prérequis

Assurez-vous d'avoir Node.js v20+ installé :
```bash
node --version
# Doit afficher v20.x.x ou supérieur
```

### 2. Installation

```bash
# Cloner le projet
git clone <repository-url>
cd ce-tot-to-discord

# Installer les dépendances
npm install

# Créer la configuration
cp config.json.dist config.json

# Créer le dossier de logs
mkdir logs
```

### 3. Configuration des webhooks Discord

#### Créer un webhook Discord

1. Sur Discord, aller dans les paramètres du canal
2. Intégrations → Webhooks → Nouveau Webhook
3. Copier l'URL du webhook

#### Éditer config.json

Remplacer les URLs de webhooks dans le fichier :

```json
{
  "discord": [
    {
      "webhook": "https://discord.com/api/webhooks/VOTRE_ID/VOTRE_TOKEN",
      "message": "..."
    }
  ]
}
```

### 4. Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur http://localhost:3000

### 5. Tester

#### Test de santé

```bash
curl http://localhost:3000/health
```

Réponse attendue :
```json
{"status":"ok","timestamp":"2024-10-18T10:00:00.000Z"}
```

#### Test d'un webhook

```bash
curl -X POST http://localhost:3000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": "https://discord.com/api/webhooks/VOTRE_ID/VOTRE_TOKEN",
    "message": "Test de connexion !"
  }'
```

Si tout fonctionne, vous devriez recevoir un message sur Discord.

#### Test d'un événement

```bash
curl "http://localhost:3000/log?date=2024-10-18%2010:00:00&steamId=123456&charName=TestPlayer&actName=&eventId=FlowChartLog&eventCategory=Test&eventType=Test&params=%5B%5BCRIME%5D%5D%20Test%20de%20crime"
```

## Configuration de base

### Exemple minimal

Créer une règle simple qui log tous les crimes :

```json
{
  "meta": {
    "version": "2.0",
    "lastModified": "2024-10-18T10:00:00Z"
  },
  "global": {
    "logDirectory": "./logs",
    "logRotation": "monthly",
    "logDateFormat": "YYYY-MM-DD HH:mm:ss",
    "logMessageTemplate": "[[date]] | [[fullIdentity]] | [[eventId]] | [[params]]",
    "discordRateLimit": {
      "requestsPerSecond": 4,
      "maxQueueSize": 1000,
      "onQueueFull": "drop"
    }
  },
  "watchedEntities": [],
  "rules": [
    {
      "id": "all_crimes",
      "name": "Tous les crimes",
      "enabled": true,
      "priority": 10,
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
            "id": "crime_webhook",
            "webhook": "https://discord.com/api/webhooks/VOTRE_ID/VOTRE_TOKEN",
            "webhookType": "admin",
            "message": "🚨 Crime détecté !\n**Joueur:** [[fullIdentity]]\n**Détails:** [[params]]"
          }
        ]
      }
    }
  ]
}
```

### Ajouter une entité surveillée

1. Ajouter dans `watchedEntities` :

```json
{
  "watchedEntities": [
    {
      "id": "watch_suspect",
      "name": "Joueur suspect",
      "enabled": true,
      "matchType": "charName",
      "value": "NomDuPersonnage",
      "description": "Joueur à surveiller"
    }
  ]
}
```

2. Utiliser dans une règle :

```json
{
  "id": "watched_player_alert",
  "name": "Alerte joueur surveillé",
  "enabled": true,
  "priority": 20,
  "stopPropagation": false,
  "conditions": {
    "watchedEntity": {
      "anyOf": ["watch_suspect"]
    }
  },
  "actions": {
    "discord": [
      {
        "id": "alert",
        "webhook": "https://discord.com/api/webhooks/VOTRE_ID/VOTRE_TOKEN",
        "message": "@here Activité du joueur surveillé : [[fullIdentity]]\nÉvénement : [[eventId]]\nDétails : [[params]]",
        "allowMentions": true
      }
    ]
  }
}
```

## Cas d'usage courants

### 1. Surveiller des compétences spécifiques

```json
{
  "id": "pickpocket_tracking",
  "name": "Détection de vol à la tire",
  "enabled": true,
  "priority": 15,
  "stopPropagation": false,
  "conditions": {
    "eventId": "RR_ABILITY_USE",
    "parsed": {
      "action": {
        "in": ["Pickpocket"]
      }
    }
  },
  "actions": {
    "log": {
      "enabled": true,
      "fileName": "pickpocket"
    },
    "discord": [
      {
        "id": "pickpocket_alert",
        "webhook": "VOTRE_WEBHOOK",
        "message": "🎭 **[[fullIdentity]]** a tenté un pickpocket sur **[[parsed.target]]** → [[parsed.result]]"
      }
    ]
  }
}
```

### 2. Canal public vs canal admin

```json
{
  "actions": {
    "discord": [
      {
        "id": "public",
        "webhook": "WEBHOOK_PUBLIC",
        "webhookType": "public",
        "message": "🚨 [[displayName]] a commis un crime !"
      },
      {
        "id": "admin",
        "webhook": "WEBHOOK_ADMIN",
        "webhookType": "admin",
        "message": "🚨 Crime détecté\n**Joueur:** [[charName]] ([[steamId]])\n**Alias:** [[actName]]\n**Détails:** [[params]]"
      }
    ]
  }
}
```

### 3. Filtrer par plusieurs tags

```json
{
  "conditions": {
    "eventId": "FlowChartLog",
    "parsed": {
      "tags": {
        "contains": ["CRIME", "THEFT"],
        "matchMode": "all"
      }
    }
  }
}
```

### 4. Exclure certains joueurs

```json
{
  "conditions": {
    "eventId": "FlowChartLog",
    "parsed": {
      "tags": {
        "contains": ["CRIME"]
      }
    },
    "NOT": {
      "charName": {
        "in": ["Admin", "Moderator"]
      }
    }
  }
}
```

## Dépannage rapide

### Le serveur ne démarre pas

**Erreur : "Failed to load configuration"**
```bash
# Vérifier que config.json existe et est valide
cat config.json | jq .

# Si jq n'est pas installé, utiliser :
node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
```

**Erreur : "Port already in use"**
```bash
# Changer le port
PORT=3001 npm run dev
```

### Les webhooks ne fonctionnent pas

1. Tester le webhook manuellement :
```bash
curl -X POST http://localhost:3000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"webhook":"VOTRE_URL","message":"Test"}'
```

2. Vérifier les logs du serveur pour voir les erreurs

3. Vérifier les stats de la queue :
```bash
curl http://localhost:3000/stats
```

### Les logs ne sont pas créés

1. Vérifier que le dossier logs existe :
```bash
mkdir -p logs
```

2. Vérifier les permissions :
```bash
chmod 755 logs
```

3. Vérifier que `log.enabled: true` dans la règle

### La configuration n'est pas rechargée

1. Vérifier la syntaxe JSON :
```bash
curl -X POST http://localhost:3000/config/validate \
  -H "Content-Type: application/json" \
  -d @config.json
```

2. Si des erreurs apparaissent, les corriger

3. Sauvegarder le fichier (le hot-reload devrait se déclencher)

4. Vérifier les logs du serveur : `[Config] Configuration file changed, reloading...`

## Commandes utiles

### Vérifier la configuration actuelle
```bash
curl http://localhost:3000/config | jq .
```

### Lister les logs disponibles
```bash
curl http://localhost:3000/logs | jq .
```

### Télécharger un log
```bash
curl http://localhost:3000/logs/2024-10/crimes.log
```

### Voir les stats de la queue
```bash
curl http://localhost:3000/stats | jq .
```

### Tester un template
```bash
curl -X POST http://localhost:3000/test/template \
  -H "Content-Type: application/json" \
  -d '{
    "template": "[[charName]] a fait [[parsed.action]]",
    "sampleEvent": {
      "date": "2024-10-18 10:00:00",
      "steamId": "123456",
      "charName": "TestPlayer",
      "actName": "",
      "eventId": "RR_ABILITY_USE",
      "eventCategory": "Action",
      "eventType": "Ability",
      "params": "Pickpocket|Victim (Success)"
    },
    "webhookType": "admin"
  }' | jq .
```

## Intégration avec le serveur de jeu

### Format des requêtes

Le serveur de jeu doit envoyer des requêtes GET vers :
- `http://VOTRE_IP:3000/log` pour les événements de log
- `http://VOTRE_IP:3000/message` pour les événements de message

### Paramètres requis

- `date` : Date/heure de l'événement (format libre)
- `steamId` : Steam ID du joueur
- `charName` : Nom du personnage
- `actName` : Nom d'emprunt (peut être vide)
- `eventId` : Type d'événement (RR_ABILITY_USE, FlowChartLog, etc.)
- `eventCategory` : Catégorie (Admin, Player, etc.)
- `eventType` : Type spécifique
- `params` : Paramètres de l'événement

### Exemple d'URL encodée

```
http://localhost:3000/log?date=2024-10-18%2010:46:21&steamId=76561198018484513&charName=Nylath&actName=Jonvik&eventId=FlowChartLog&eventCategory=Admin&eventType=FlowChart&params=%5B%5BCRIME%5D%5D%20Vol%20de%20100%20pieces
```

Décodé :
```
date=2024-10-18 10:46:21
steamId=76561198018484513
charName=Nylath
actName=Jonvik
eventId=FlowChartLog
eventCategory=Admin
eventType=FlowChart
params=[[CRIME]] Vol de 100 pieces
```

## Prochaines étapes

1. **Personnaliser les règles** selon vos besoins
2. **Configurer les webhooks Discord** pour différents canaux
3. **Ajouter des entités surveillées** (joueurs à suivre)
4. **Tester** avec des événements réels du serveur de jeu
5. **Affiner les messages** Discord pour plus de clarté
6. **Consulter les logs** régulièrement pour détecter des patterns

## Support

Pour plus d'informations :
- README.md : Documentation complète
- ARCHITECTURE.md : Détails techniques
- config.example.json : Exemple de configuration avancée

Bon tracking ! 🎮