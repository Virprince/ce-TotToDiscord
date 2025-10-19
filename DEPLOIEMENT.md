# 🚀 Guide de déploiement pour ce-tottodiscord.vassharans.com

## Résumé

Votre application est maintenant prête pour le déploiement sur o2switch ! Voici tout ce qui a été préparé :

## ✅ Ce qui a été fait

1. **Frontend configuré** pour la production avec build optimisé
2. **Backend modifié** pour servir les fichiers statiques du frontend
3. **Configuration de production** créée avec template
4. **Scripts de déploiement** automatisés
5. **Documentation complète** du processus

## 📁 Structure de déploiement

```
backend/
├── dist/                     # ✅ Backend compilé
├── public/                   # ✅ Frontend build (copies automatiquement)
├── scripts/                  # ✅ Utilitaires (hash password)
├── package.production.json   # ✅ À renommer en package.json
├── config.production.json    # ✅ Template à configurer
└── logs/                     # À créer sur le serveur
```

## 🎯 Déploiement en 3 étapes

### 1. Build local (déjà fait)
```bash
./scripts/build-and-deploy.sh
```

### 2. Upload sur o2switch
- Uploadez tout le dossier `backend/` vers votre domaine
- Renommez `package.production.json` → `package.json`
- Copiez `config.production.json` → `config.json`

### 3. Configuration serveur
```bash
# Sur le serveur o2switch
npm install --production
mkdir logs
npx tsx scripts/hash-password.ts VOTRE_MOT_DE_PASSE
```

## 📋 Checklist détaillée

Consultez ces fichiers pour le déploiement :
- `deploy/README-DEPLOYMENT.md` - Guide complet pas à pas
- `deploy/upload-checklist.md` - Checklist à cocher

## 🔧 Configuration cPanel

- **Application Node.js**
- **Version** : Node.js 18+
- **Fichier de démarrage** : `dist/app.js`
- **Domaine** : `ce-tottodiscord.vassharans.com`

## 🎉 Après déploiement

Votre site sera accessible à :
- **Interface principale** : https://ce-tottodiscord.vassharans.com
- **Panel admin** : https://ce-tottodiscord.vassharans.com/login
- **API Health** : https://ce-tottodiscord.vassharans.com/health

## ⚡ Maintenance

Pour les mises à jour futures :
1. Modifiez le code localement
2. Exécutez `./scripts/build-and-deploy.sh`
3. Uploadez uniquement les fichiers modifiés
4. Redémarrez l'app via cPanel

## 💡 Points importants

- ✅ **Sécurisé** : Authentication JWT, protection des identités
- ✅ **Performant** : Frontend servi en statique, rate limiting Discord
- ✅ **Maintenable** : Hot-reload config, logs rotatifs
- ✅ **Production-ready** : Build optimisé, gestion d'erreurs

Tout est prêt pour votre mise en ligne ! 🎯