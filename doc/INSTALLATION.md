# Installation complète - Game Event Tracker

Guide d'installation pas à pas pour mettre en place le système complet (backend + frontend).

## 📋 Prérequis

- Node.js v20 ou supérieur
- npm (fourni avec Node.js)
- Un serveur Discord avec permissions pour créer des webhooks

## 🚀 Installation

### Étape 1 : Créer la structure du projet

```bash
# Créer le dossier principal
mkdir game-event-tracker
cd game-event-tracker

# Créer les sous-dossiers
mkdir backend frontend
```

### Étape 2 : Installation du Backend

```bash
cd backend

# Créer package.json
npm init -y

# Installer les dépendances
npm install fastify@^4.28.1 \
  @fastify/cors@^9.0.1 \
  chokidar@^3.6.0 \
  node-fetch@^3.3.2 \
  p-queue@^8.0.1 \
  pino-pretty@^11.2.2 \
  winston@^3.14.2 \
  winston-daily-rotate-file@^5.0.0

# Installer les dépendances de développement
npm install --save-dev \
  @types/node@^20.14.15 \
  tsx@^4.17.0 \
  typescript@^5.5.4

# Créer la structure des dossiers
mkdir -p src/{types,config,services,routes}
mkdir logs

# Copier les fichiers sources (depuis les artifacts précédents)
# - src/types/index.ts
# - src/config/loader.ts
# - src/config/validator.ts
# - src/services/parsers.ts
# - src/services/normalizer.ts
# - src/services/ruleEngine.ts
# - src/services/templating.ts
# - src/services/logger.ts
# - src/services/discordQueue.ts
# - src/routes/index.ts
# - src/app.ts
# - package.json (mettre à jour avec les scripts)
# - tsconfig.json
# - .gitignore

# Créer la configuration
cp config.example.json config.json

# Éditer config.json et remplacer les URLs de webhooks
nano config.json  # ou votre éditeur préféré
```

**Contenu minimal de package.json :**
```json
{
  "name": "game-event-tracker-backend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "type-check": "tsc --noEmit"
  }
}
```

### Étape 3 : Installation du Frontend

```bash
cd ../frontend

# Créer le projet Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# Installer les dépendances supplémentaires
npm install \
  @radix-ui/react-accordion@^1.2.0 \
  @radix-ui/react-alert-dialog@^1.1.1 \
  @radix-ui/react-checkbox@^1.1.1 \
  @radix-ui/react-dialog@^1.1.1 \
  @radix-ui/react-dropdown-menu@^2.1.1 \
  @radix-ui/react-label@^2.1.0 \
  @radix-ui/react-popover@^1.1.1 \
  @radix-ui/react-select@^2.1.1 \
  @radix-ui/react-separator@^1.1.0 \
  @radix-ui/react-slot@^1.1.0 \
  @radix-ui/react-switch@^1.1.0 \
  @radix-ui/react-tabs@^1.1.0 \
  @radix-ui/react-toast@^1.2.1 \
  @tanstack/react-query@^5.56.2 \
  class-variance-authority@^0.7.0 \
  clsx@^2.1.1 \
  lucide-react@^0.441.0 \
  react-hook-form@^7.53.0 \
  react-router-dom@^6.26.2 \
  tailwind-merge@^2.5.2 \
  zod@^3.23.8

# Installer Tailwind CSS
npm install --save-dev \
  tailwindcss@^3.4.11 \
  postcss@^8.4.47 \
  autoprefixer@^10.4.20

# Créer la structure
mkdir -p src/{components/ui,pages,lib,types}

# Copier tous les fichiers sources (depuis les artifacts)
# - src/components/ui/* (button, card, input, label, badge)
# - src/components/RuleEditor.tsx
# - src/pages/* (Dashboard, Rules, WatchedEntities, Logs, Testing, Settings)
# - src/lib/api.ts
# - src/lib/utils.ts
# - src/types/index.ts
# - src/App.tsx
# - src/main.tsx
# - src/index.css
# - index.html
# - vite.config.ts
# - tailwind.config.js
# - tsconfig.json
# - tsconfig.node.json
# - postcss.config.js
```

### Étape 4 : Configuration Discord

1. **Créer un webhook Discord :**
   - Ouvrir Discord
   - Aller dans les paramètres du canal
   - Intégrations → Webhooks → Nouveau Webhook
   - Copier l'URL du webhook

2. **Configurer le backend :**
   ```bash
   cd ../backend
   nano config.json
   ```
   
   Remplacer `YOUR_WEBHOOK_URL` par vos URLs de webhooks Discord.

### Étape 5 : Test de l'installation

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

Vous devriez voir :
```
[App] Initializing...
[Config] Configuration loaded successfully
[App] Server listening on http://0.0.0.0:3000
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

Vous devriez voir :
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Terminal 3 - Test API :**
```bash
# Test de santé
curl http://localhost:3000/health

# Devrait retourner:
# {"status":"ok","timestamp":"..."}
```

### Étape 6 : Vérification

1. **Ouvrir le frontend :** http://localhost:5173
2. **Vérifier le Dashboard :** Stats et règles devraient s'afficher
3. **Tester un webhook :**
   - Aller dans "Tests"
   - Entrer une URL de webhook Discord
   - Envoyer un message de test
   - Vérifier la réception sur Discord

## 🎯 Prochaines étapes

### 1. Créer votre première règle

Via l'interface web :
1. Aller dans "Règles" → "Nouvelle règle"
2. Nommer : "Test de crimes"
3. Conditions : eventId = "FlowChartLog", tags contient "CRIME"
4. Actions : Ajouter un webhook Discord
5. Message : `🚨 [[displayName]] a commis un crime !`
6. Enregistrer

### 2. Ajouter une entité surveillée

1. Aller dans "Entités surveillées" → "Nouvelle entité"
2. Nom : "Joueur test"
3. Type : "Nom du personnage"
4. Valeur : Le nom d'un personnage du jeu
5. Enregistrer

### 3. Tester avec le serveur de jeu

Configurer le serveur de jeu pour envoyer des requêtes vers :
```
http://VOTRE_IP:3000/log?date=...&steamId=...&charName=...
```

## 🐛 Dépannage

### Backend ne démarre pas

```bash
# Vérifier Node.js
node --version  # Doit être v20+

# Vérifier la config
cat config.json | jq .

# Logs détaillés
DEBUG=* npm run dev
```

### Frontend ne se connecte pas au backend

1. Vérifier que le backend tourne sur port 3000
2. Vérifier le proxy dans `vite.config.ts`
3. Ouvrir la console du navigateur (F12)

### Webhooks ne fonctionnent pas

1. Tester via l'interface (page Tests)
2. Vérifier l'URL du webhook (doit commencer par https://discord.com/api/webhooks/)
3. Vérifier les logs du backend
4. Vérifier les permissions Discord

## 📚 Documentation

- **README.md** : Documentation backend
- **frontend/README.md** : Documentation frontend
- **GUIDE_COMPLET.md** : Guide d'utilisation complet
- **ARCHITECTURE.md** : Architecture technique
- **QUICKSTART.md** : Guide de démarrage rapide

## ✅ Checklist de validation

- [ ] Node.js v20+ installé
- [ ] Backend installé et démarre sans erreur
- [ ] Frontend installé et démarre sans erreur
- [ ] Webhooks Discord créés
- [ ] config.json configuré avec les webhooks
- [ ] Test de santé API réussit
- [ ] Interface web accessible
- [ ] Test webhook Discord réussit
- [ ] Première règle créée
- [ ] Dossier logs créé et accessible

## 🎉 Installation terminée !

Votre système Game Event Tracker est maintenant opérationnel.

Pour démarrer le système :
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

Accédez à l'interface : **http://localhost:5173**

Bon tracking ! 🎮