# Guide Complet - Game Event Tracker

## 🎯 Vue d'ensemble

Game Event Tracker est un système complet de tracking d'événements de jeu vidéo avec intégration Discord. Il se compose de deux parties :

- **Backend** : API Node.js/TypeScript avec moteur de règles sophistiqué
- **Frontend** : Interface web React pour l'administration

## 📋 Table des matières

1. [Installation rapide](#installation-rapide)
2. [Architecture](#architecture)
3. [Fonctionnalités](#fonctionnalités)
4. [Configuration](#configuration)
5. [Utilisation](#utilisation)
6. [Déploiement](#déploiement)

## 🚀 Installation rapide

### Prérequis
- Node.js v20+
- npm ou yarn

### Backend

```bash
# Installation
cd backend
npm install

# Configuration
cp config.example.json config.json
# Éditez config.json et ajoutez vos webhooks Discord

# Créer le dossier logs
mkdir logs

# Développement
npm run dev

# Production
npm run build
npm start
```

Le backend démarre sur http://localhost:3000

### Frontend

```bash
# Installation
cd frontend
npm install

# Développement
npm run dev

# Production
npm run build
```

Le frontend démarre sur http://localhost:5173

## 🏗️ Architecture

### Backend

```
backend/
├── src/
│   ├── types/          # Types TypeScript
│   ├── config/         # Chargement et validation config
│   ├── services/       # Services métier
│   │   ├── parsers.ts
│   │   ├── normalizer.ts
│   │   ├── ruleEngine.ts
│   │   ├── templating.ts
│   │   ├── logger.ts
│   │   └── discordQueue.ts
│   ├── routes/         # API REST
│   └── app.ts          # Entry point
├── config.json         # Configuration (à créer)
├── logs/               # Logs générés
└── package.json
```

### Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/         # Composants de base
│   │   └── RuleEditor.tsx
│   ├── pages/          # Pages de l'app
│   │   ├── Dashboard.tsx
│   │   ├── Rules.tsx
│   │   ├── WatchedEntities.tsx
│   │   ├── Logs.tsx
│   │   ├── Testing.tsx
│   │   └── Settings.tsx
│   ├── lib/
│   │   ├── api.ts      # Client API
│   │   └── utils.ts
│   ├── types/          # Types partagés
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## ⚡ Fonctionnalités

### Backend

✅ **Parsers structurés**
- RR_ABILITY_USE : `"action|target (result)"`
- FlowChartLog : `"[[TAG1]][[TAG2]] texte"`

✅ **Moteur de règles**
- Priorités et conditions complexes
- AND/OR/NOT logiques
- Conditions sur données parsées
- Stop propagation

✅ **Surveillance d'entités**
- Par steamId (tous les persos du joueur)
- Par charName (personnage spécifique)
- Par actName (alias)

✅ **Multi-webhooks par règle**
- Conditions additionnelles par webhook
- Types public/admin avec protection identités
- Rate limiting automatique

✅ **Logs rotatifs**
- Rotation mensuelle/hebdomadaire/quotidienne
- Organisation par dossiers datés
- Template personnalisable

✅ **Hot-reload**
- Modification config sans redémarrage
- Validation en temps réel

✅ **API REST complète**
- Gestion configuration
- Tests webhooks/templates
- Consultation logs
- Stats en temps réel

### Frontend

✅ **Dashboard**
- Vue d'ensemble système
- Stats temps réel
- Règles actives
- Queue Discord

✅ **Éditeur de règles visuel**
- Formulaires intuitifs
- Validation en temps réel
- Multi-webhooks
- Conditions complexes

✅ **Gestion entités surveillées**
- Ajout/modification/suppression
- Types de surveillance
- Activation/désactivation

✅ **Viewer de logs**
- Liste tous les fichiers
- Recherche en temps réel
- Téléchargement
- Visualisation inline

✅ **Tests intégrés**
- Test webhooks Discord
- Test templates avec preview
- Documentation variables

✅ **Configuration globale**
- Paramètres logs
- Rate limiting
- Templates par défaut

## ⚙️ Configuration

### Structure de base

```json
{
  "meta": {
    "version": "2.0",
    "lastModified": "2025-10-18T12:00:00Z"
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
  "rules": []
}
```

### Exemple de règle complète

```json
{
  "id": "crime_tracking",
  "name": "Suivi des crimes (3 niveaux)",
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
        "id": "public",
        "webhook": "https://discord.com/api/webhooks/.../public",
        "webhookType": "public",
        "message": "🚨 [[displayName]] a commis un crime !"
      },
      {
        "id": "admin",
        "webhook": "https://discord.com/api/webhooks/.../admin",
        "webhookType": "admin",
        "message": "**[[fullIdentity]]** a commis un crime\nSteam: [[steamId]]\nDétails: [[params]]"
      },
      {
        "id": "watched",
        "webhook": "https://discord.com/api/webhooks/.../alerts",
        "webhookType": "admin",
        "message": "@here 🚨 Entité surveillée : [[charName]]",
        "allowMentions": true,
        "conditions": {
          "watchedEntity": {
            "anyOf": ["watch_foo"]
          }
        }
      }
    ]
  }
}
```

### Variables disponibles

**Standard (public safe) :**
- `[[displayName]]` : Nom affiché (actName ou charName)
- `[[date]]`, `[[eventId]]`, `[[eventType]]`, `[[params]]`

**Admin uniquement :**
- `[[charName]]` : Nom du personnage
- `[[actName]]` : Alias
- `[[steamId]]` : Steam ID
- `[[fullIdentity]]` : "CharName (alias: ActName)"

**Parsées RR_ABILITY_USE :**
- `[[parsed.action]]`, `[[parsed.target]]`, `[[parsed.result]]`

**Parsées FlowChartLog :**
- `[[parsed.tagsFormatted]]`, `[[parsed.tags.0]]`, `[[parsed.tags.1]]`

## 📖 Utilisation

### 1. Configuration initiale

1. Créer des webhooks Discord dans vos canaux
2. Configurer `config.json` avec les URLs
3. Démarrer le backend : `npm run dev`
4. Démarrer le frontend : `cd frontend && npm run dev`
5. Ouvrir http://localhost:5173

### 2. Créer une règle

**Via l'interface web :**
1. Aller dans "Règles" → "Nouvelle règle"
2. Nommer la règle et définir la priorité
3. Configurer les conditions (eventId, tags, etc.)
4. Ajouter des actions (log et/ou Discord)
5. Enregistrer

**Via config.json :**
1. Éditer le fichier `config.json`
2. Ajouter une règle dans `rules[]`
3. Sauvegarder (hot-reload automatique)

### 3. Ajouter une entité surveillée

**Via l'interface web :**
1. Aller dans "Entités surveillées" → "Nouvelle entité"
2. Choisir le type (steamId/charName/actName)
3. Entrer la valeur
4. Enregistrer

**Via config.json :**
```json
{
  "watchedEntities": [
    {
      "id": "watch_player",
      "name": "Joueur suspect",
      "enabled": true,
      "matchType": "steamId",
      "value": "76561198018484513",
      "description": "Joueur à surveiller",
      "createdAt": "2025-10-18T10:00:00Z"
    }
  ]
}
```

### 4. Tester un webhook

**Via l'interface web :**
1. Aller dans "Tests"
2. Entrer l'URL du webhook
3. Personnaliser le message
4. Cliquer "Envoyer le test"

**Via API :**
```bash
curl -X POST http://localhost:3000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"webhook":"URL","message":"Test"}'
```

### 5. Consulter les logs

**Via l'interface web :**
1. Aller dans "Logs"
2. Sélectionner un fichier
3. Rechercher avec Ctrl+F
4. Télécharger si nécessaire

**Via fichiers :**
```bash
cd logs
ls -la 2024-10/  # Logs du mois
cat 2024-10/crimes.log  # Consulter
```

## 🚀 Déploiement

### Option 1 : PM2 (Recommandé)

```bash
# Installer PM2
npm install -g pm2

# Backend
cd backend
npm run build
pm2 start dist/app.js --name game-event-tracker

# Frontend (build et servir via nginx/autre)
cd frontend
npm run build
# Copier dist/ vers serveur web
```

### Option 2 : Docker

```dockerfile
# Dockerfile backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# Dockerfile frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Option 3 : Systemd

```ini
# /etc/systemd/system/game-event-tracker.service
[Unit]
Description=Game Event Tracker
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/game-event-tracker
ExecStart=/usr/bin/node dist/app.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable game-event-tracker
sudo systemctl start game-event-tracker
```

## 🔧 Dépannage

### Le backend ne démarre pas

**Erreur : "Failed to load configuration"**
```bash
# Vérifier que config.json existe
ls -la config.json

# Vérifier la syntaxe JSON
cat config.json | jq .
```

**Erreur : "Port already in use"**
```bash
# Changer le port
PORT=3001 npm run dev
```

### Les webhooks ne fonctionnent pas

1. Tester le webhook manuellement (page Tests)
2. Vérifier les logs du backend
3. Vérifier la queue : http://localhost:3000/stats
4. Vérifier que l'URL est correcte et commence par `https://discord.com/api/webhooks/`

### Les logs ne sont pas créés

1. Vérifier que le dossier existe : `mkdir -p logs`
2. Vérifier les permissions : `chmod 755 logs`
3. Vérifier que `log.enabled: true` dans les règles

### Hot-reload ne fonctionne pas

1. Vérifier la syntaxe du fichier JSON
2. Consulter les logs du backend
3. Valider via l'API : `POST /config/validate`

## 📚 Documentation supplémentaire

- **README.md** : Documentation backend
- **ARCHITECTURE.md** : Architecture technique détaillée
- **QUICKSTART.md** : Guide de démarrage rapide
- **frontend/README.md** : Documentation frontend

## 🆘 Support

Pour toute question ou problème :
1. Consultez les logs du backend
2. Vérifiez la configuration avec `/config/validate`
3. Testez les webhooks avec la page Tests
4. Consultez la documentation technique

## 📝 Changelog

### Version 2.0
- ✅ Parsers structurés pour RR_ABILITY_USE et FlowChartLog
- ✅ Interface web d'administration complète
- ✅ Multi-webhooks par règle avec conditions
- ✅ Protection des identités (public/admin)
- ✅ Hot-reload de configuration
- ✅ Tests intégrés (webhooks, templates)
- ✅ Viewer de logs avec recherche
- ✅ Dashboard avec stats temps réel

## 📄 Licence

MIT