# Game Event Tracker - Frontend

Interface web d'administration pour Game Event Tracker.

## Installation

```bash
cd frontend
npm install
```

## Développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173

Le proxy Vite redirige automatiquement `/api/*` vers `http://localhost:3000` (le backend).

## Build production

```bash
npm run build
```

Les fichiers de build seront dans `frontend/dist/`.

## Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # Composants UI de base (shadcn/ui)
│   │   └── RuleEditor.tsx # Éditeur de règles
│   ├── pages/
│   │   ├── Dashboard.tsx        # Page d'accueil avec stats
│   │   ├── Rules.tsx            # Gestion des règles
│   │   ├── WatchedEntities.tsx  # Gestion des entités surveillées
│   │   ├── Logs.tsx             # Consultation des logs
│   │   ├── Testing.tsx          # Tests webhooks et templates
│   │   └── Settings.tsx         # Paramètres globaux
│   ├── lib/
│   │   ├── api.ts       # Client API
│   │   └── utils.ts     # Utilitaires
│   ├── types/
│   │   └── index.ts     # Types TypeScript
│   ├── App.tsx          # Composant principal
│   ├── main.tsx         # Point d'entrée
│   └── index.css        # Styles globaux
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Fonctionnalités

### Dashboard
- Vue d'ensemble du système
- Statistiques en temps réel
- Règles actives
- Queue Discord
- Accès rapide aux fonctionnalités

### Gestion des règles
- Créer, modifier, supprimer des règles
- Activer/désactiver des règles
- Dupliquer des règles
- Éditeur visuel avec formulaires
- Configuration des conditions et actions
- Support multi-webhooks

### Entités surveillées
- Ajouter des joueurs/personnages à surveiller
- Par Steam ID, nom de personnage ou alias
- Activer/désactiver la surveillance
- Description et métadonnées

### Consultation des logs
- Liste tous les fichiers de logs
- Recherche dans les logs
- Téléchargement des fichiers
- Visualisation en temps réel

### Tests
- Test de webhooks Discord
- Test de templates avec données d'exemple
- Variables disponibles documentées
- Aperçu en temps réel

### Paramètres
- Configuration globale
- Rotation des logs
- Rate limiting Discord
- Templates par défaut

## Technologies

- **React 18** : Framework UI
- **TypeScript** : Typage statique
- **Vite** : Build tool rapide
- **TanStack Query** : Gestion du cache et des requêtes API
- **React Router** : Routing
- **Tailwind CSS** : Styling
- **shadcn/ui** : Composants UI accessibles
- **Lucide React** : Icônes

## Configuration

Le frontend communique avec le backend via un proxy Vite configuré dans `vite.config.ts` :

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

Pour changer l'URL du backend, modifiez le `target` dans `vite.config.ts`.

## Déploiement

### Option 1 : Servir depuis le backend

1. Build le frontend :
```bash
cd frontend
npm run build
```

2. Copier les fichiers dans le backend :
```bash
cp -r dist/* ../backend/public/
```

3. Configurer le backend pour servir les fichiers statiques (Fastify) :
```typescript
import fastifyStatic from '@fastify/static';

fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/'
});
```

### Option 2 : Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 3 : Serveur statique séparé

Utilisez n'importe quel serveur statique (Vercel, Netlify, etc.) et configurez la variable d'environnement pour l'URL de l'API.

## Support navigateurs

- Chrome/Edge (dernières versions)
- Firefox (dernières versions)
- Safari (dernières versions)

## Licence

MIT