# Checklist de déploiement o2switch

## ✅ Fichiers à uploader

### Structure à créer sur o2switch :
```
votre-dossier-domaine/
├── dist/                    # Backend compilé
├── public/                  # Frontend build
├── scripts/                 # Scripts utilitaires
├── package.json            # Dépendances (package.production.json renommé)
├── config.json             # Configuration (config.production.json modifié)
└── logs/                   # Dossier de logs (à créer)
```

## 📋 Étapes de déploiement

- [ ] **1. Build local** : Exécuter `./scripts/build-and-deploy.sh`
- [ ] **2. Upload fichiers** via cPanel gestionnaire de fichiers
- [ ] **3. Renommer** `package.production.json` → `package.json`
- [ ] **4. Copier** `config.production.json` → `config.json`
- [ ] **5. Modifier config.json** avec vos vraies valeurs
- [ ] **6. Installer dépendances** : `npm install --production`
- [ ] **7. Créer dossier logs** : `mkdir logs && chmod 755 logs`
- [ ] **8. Générer hash mot de passe** : `npx tsx scripts/hash-password.ts MOTDEPASSE`
- [ ] **9. Configurer Node.js App** dans cPanel
- [ ] **10. Tester l'accès** : https://ce-tottodiscord.vassharans.com

## ⚙️ Configuration cPanel Node.js

- **Version Node.js** : ≥ 18
- **Mode** : Production
- **Fichier de démarrage** : `dist/app.js`
- **Domaine** : `ce-tottodiscord.vassharans.com`

## 🔐 Sécurité

- [ ] **Générer un JWT secret** de 32 caractères minimum
- [ ] **Configurer un mot de passe fort** pour l'admin
- [ ] **Vérifier les permissions** des fichiers (644 pour les fichiers, 755 pour les dossiers)
- [ ] **Tester l'authentification** après déploiement

## 🎯 URLs importantes

- **Site principal** : https://ce-tottodiscord.vassharans.com
- **API Health check** : https://ce-tottodiscord.vassharans.com/health
- **Interface admin** : https://ce-tottodiscord.vassharans.com/login

## 🔧 Post-déploiement

- [ ] **Tester l'interface admin**
- [ ] **Configurer les webhooks Discord**
- [ ] **Tester un webhook** via l'interface
- [ ] **Vérifier les logs** se créent correctement
- [ ] **Sauvegarder config.json** quelque part de sûr