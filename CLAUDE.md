# CLAUDE.md

## Contexte général
Tu travailles sur un système fullstack de tracking d'événements de jeu vidéo avec intégration Discord. 
Le projet est composé d'un backend Node.js/TypeScript et d'un frontend React/TypeScript.

## Structure du projet
```
ce-tot-to-discord/
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── types/           # Types TypeScript
│   │   ├── config/          # Gestion configuration
│   │   ├── services/        # Logique métier
│   │   ├── routes/          # API REST
│   │   └── app.ts           # Entry point
│   ├── scripts/             # Scripts utilitaires
│   ├── logs/                # Logs rotatifs (gitignored)
│   ├── config.json          # Config (gitignored)
│   └── package.json
│
└── frontend/                # Interface React
    ├── src/
    │   ├── components/      # Composants React
    │   ├── pages/           # Pages de l'app
    │   ├── contexts/        # Contextes React
    │   ├── lib/             # Utilitaires
    │   └── types/           # Types TypeScript
    └── package.json
```

## Stack technique

### Backend
- **Runtime**: Node.js v20+
- **Framework**: Fastify v4
- **Language**: TypeScript
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Logs**: Winston + winston-daily-rotate-file
- **Queue**: p-queue (rate limiting Discord)
- **Config**: JSON avec hot-reload (chokidar)
- **Validation**: Zod (implicite dans la structure)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite 7
- **Routing**: React Router v6
- **State**: TanStack Query (React Query)
- **UI**: shadcn/ui style (composants custom)
- **Styling**: Tailwind CSS
- **Auth**: JWT stocké dans localStorage
- **Icons**: lucide-react

## Concepts clés du projet

### Backend

1. **Parsers structurés** :
   - `RR_ABILITY_USE`: Parse "action|target (result)"
   - `FlowChartLog`: Parse "[[TAG1]][[TAG2]] texte"

2. **Moteur de règles** :
   - Priorités (ordre d'évaluation)
   - Conditions complexes (AND/OR/NOT)
   - Stop propagation
   - Déduplication automatique

3. **Variables de templating** :
   - Standard: `[[date]]`, `[[eventId]]`, `[[params]]`, `[[displayName]]`
   - Admin: `[[charName]]`, `[[actName]]`, `[[steamId]]`, `[[fullIdentity]]`
   - Parsées: `[[parsed.action]]`, `[[parsed.tags.0]]`, etc.

4. **Protection des identités** :
   - Webhooks "public": masque charName, steamId, actName
   - Webhooks "admin": toutes les variables disponibles
   - Variable `displayName` = actName || charName (safe pour public)
   - Variable `fullIdentity` = "CharName (alias: ActName)" ou juste "CharName"

5. **Authentification** :
   - Un seul compte admin (username + password hashé)
   - JWT avec expiration 24h
   - Routes publiques: `/auth/login`, `/health`, `/log`, `/message`
   - Routes protégées: tout le reste

### Frontend

1. **Architecture** :
   - AuthContext pour la gestion de session
   - ProtectedRoute pour protéger les pages
   - API client avec auto-ajout du token JWT

2. **Pages** :
   - Login: Authentification
   - Dashboard: Stats et vue d'ensemble
   - Rules: CRUD des règles (liste + éditeur)
   - WatchedEntities: Gestion des entités surveillées
   - Logs: Viewer avec recherche et téléchargement
   - Testing: Tests webhooks et templates
   - Settings: Configuration globale

3. **Composants UI** :
   - Style shadcn/ui (Button, Card, Input, Label, Badge)
   - Pas de bibliothèque externe installée (composants custom)
   - Tailwind pour le styling

## Règles de codage importantes

### Global
1. Les fonctions et les variables doivent être en anglais
2. les commentaires et la documentation doit être en anglais

### Backend

1. **JAMAIS utiliser localStorage/sessionStorage** dans le backend (c'est Node.js)
2. **Hot-reload**: La config est rechargée automatiquement (chokidar)
3. **Rate limiting Discord**: 4 req/s par défaut, queue max 1000
4. **Logs rotatifs**: Organisation par dossier mensuel (YYYY-MM/)
5. **Validation**: Toujours valider la config avant sauvegarde
6. **Sécurité**: 
   - Hash bcrypt (10 rounds) pour les mots de passe
   - JWT secret minimum 32 caractères
   - Routes publiques limitées strictement

### Frontend

1. **Auth**:
   - Token JWT stocké dans localStorage (clé: 'auth_token')
   - Auto-redirect vers /login si 401
   - Logout = suppression du token + redirect

2. **API calls**:
   - Toujours utiliser `getAuthHeaders()` pour ajouter le token
   - Proxy Vite: `/api/*` → `http://localhost:3000`

3. **Routing**:
   - `/login` en route publique
   - `/*` protégé par ProtectedRoute

4. **Styling**:
   - Utiliser les classes Tailwind existantes uniquement
   - Pas de classes custom (pas de compilateur Tailwind)
   - Variables CSS pour les couleurs (--primary, --background, etc.)

## Fichiers sensibles (NE PAS commiter)

- `backend/config.json` (contient webhooks Discord secrets)
- `backend/logs/` (logs de production)
- `backend/.env` (si utilisé)
- `*/node_modules/`
- `*/dist/`

## Commandes importantes

### Backend
```bash
cd backend
npm run dev          # Développement avec watch
npm run build        # Build TypeScript
npm start            # Production
npx tsx scripts/hash-password.ts <password>  # Générer hash
```

### Frontend
```bash
cd frontend
npm run dev          # Développement (port 5173)
npm run build        # Build production
npm run preview      # Preview du build
```

## Format de configuration (config.json)

Structure complète attendue:
- `meta`: version, lastModified
- `auth`: username, passwordHash, jwtSecret
- `global`: logDirectory, logRotation, discordRateLimit, etc.
- `watchedEntities`: array d'entités surveillées
- `rules`: array de règles de traitement

Voir `config.example.json` pour un exemple complet.

## Cas d'usage typiques

1. **Créer une règle** : 
   - Conditions (eventId, tags, actions, etc.)
   - Actions (log + Discord webhooks)
   - Multi-webhooks avec conditions additionnelles

2. **Surveiller une entité** :
   - Par steamId (tous les persos du joueur)
   - Par charName (perso spécifique)
   - Par actName (alias)

3. **Tester un webhook** :
   - Via l'interface (page Tests)
   - Ou API: POST /test/webhook

## Principes architecturaux

1. **Séparation des responsabilités** :
   - Services = logique métier
   - Routes = endpoints HTTP
   - Types = contrats de données

2. **Extensibilité** :
   - Parsers ajoutables facilement (pattern Strategy)
   - Règles configurables sans code
   - Conditions composables (AND/OR/NOT)

3. **Performance** :
   - Hot-reload sans downtime
   - Queue asynchrone pour Discord
   - Logs rotatifs (pas de croissance infinie)

4. **Sécurité** :
   - Auth JWT obligatoire sauf routes publiques
   - Validation stricte de la config
   - Protection identités (public vs admin)

## Notes importantes

- Les routes `/log` et `/message` sont publiques car utilisées par le serveur de jeu
- Les webhooks Discord ont une limite de ~5 req/s (on utilise 4 req/s)
- Le système supporte 60+ joueurs simultanés avec milliers d'événements/jour
- actName peut être vide (fallback sur charName)
- Les tags FlowChartLog sont au format [[TAG]]
- Le format RR_ABILITY_USE est "action|target (Success|Failure)"

Quand tu codes, respecte ces conventions et cette architecture. Si tu as besoin de modifier quelque chose, demande confirmation avant de changer la structure établie.