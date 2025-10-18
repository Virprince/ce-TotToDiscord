# Installation complète - CE - Tot To Discord

Guide d'installation pas à pas pour mettre en place le système complet (backend + frontend).

## 📋 Prérequis

- Node.js v20 ou supérieur
- npm (fourni avec Node.js)
- Un serveur Discord avec permissions pour créer des webhooks

## 🚀 Installation

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
VITE v7.x.x  ready in xxx ms

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

Votre système CE - Tot To Discord est maintenant opérationnel.

Pour démarrer le système :
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

Accédez à l'interface : **http://localhost:5173**

Bon tracking ! 🎮