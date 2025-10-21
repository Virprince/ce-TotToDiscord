# Déploiement sur o2switch avec cPanel

Ce guide vous explique comment déployer l'application CE-Tot-To-Discord sur votre hébergement o2switch.

## Prérequis

- Accès cPanel sur o2switch
- Domaine configuré : `ce-tottodiscord.vassharans.com`
- Node.js activé sur votre hébergement (généralement disponible par défaut)

## Étapes de déploiement

### 1. Préparation locale

```bash
# Exécuter le script de build
./scripts/build-and-deploy.sh
```

### 2. Upload des fichiers

1. **Connectez-vous à cPanel** sur o2switch
2. **Ouvrez le gestionnaire de fichiers**
3. **Naviguez vers le dossier de votre domaine** (généralement `public_html/ce-tottodiscord` ou similaire)
4. **Uploadez les fichiers suivants** :
   - `backend/dist/` (dossier complet)
   - `backend/public/` (dossier complet)
   - `backend/package.production.json` → renommer en `package.json`
   - `backend/config.production.json` (à configurer)
   - `backend/scripts/` (dossier complet)

### 3. Installation des dépendances

1. **Ouvrez le terminal** dans cPanel (ou connectez-vous en SSH)
2. **Naviguez vers votre dossier** :
   ```bash
   cd public_html/ce-tottodiscord  # Ajustez selon votre structure
   ```
3. **Installez les dépendances** :
   ```bash
   npm install --production
   ```

### 4. Configuration

#### A. Génération du hash de mot de passe

```bash
npx tsx scripts/hash-password.ts VOTRE_MOT_DE_PASSE_ADMIN
```

Copiez le hash généré.

#### B. Configuration du fichier config.json

1. **Copiez le template** :
   ```bash
   cp config.production.json config.json
   ```

2. **Éditez config.json** avec vos vraies valeurs :
   ```json
   {
     "auth": {
       "username": "admin",
       "passwordHash": "COLLEZ_LE_HASH_GÉNÉRÉ_ICI",
       "jwtSecret": "GÉNÉREZ_UNE_CLÉ_SECRÈTE_DE_32_CARACTÈRES"
     },
     "rules": [
       {
         "actions": {
           "discord": [
             {
               "webhook": "https://discord.com/api/webhooks/VOS_VRAIS_WEBHOOKS_ICI"
             }
           ]
         }
       }
     ]
   }
   ```

3. **Créez le dossier de logs** :
   ```bash
   mkdir -p logs
   chmod 755 logs
   ```

### 5. Configuration de l'application Node.js dans cPanel

1. **Allez dans "Node.js Apps"** dans cPanel
2. **Créez une nouvelle application** :
   - **Version Node.js** : 18 ou supérieure
   - **Mode d'application** : Production
   - **Répertoire de l'application** : `/public_html/ce-tottodiscord` (ajustez)
   - **Fichier de démarrage** : `dist/app.js`
   - **Domaine** : `ce-tottodiscord.vassharans.com`

3. **Variables d'environnement** (optionnel) :
   - `NODE_ENV` = `production`
   - `PORT` = `3000` (ou le port assigné par o2switch)

### 6. Test et vérification

1. **Démarrez l'application** via cPanel
2. **Testez l'accès** : `https://ce-tottodiscord.vassharans.com`
3. **Vérifiez les logs** dans le gestionnaire de fichiers : `logs/`
4. **Testez la connexion admin** :
   - Allez sur votre site
   - Connectez-vous avec admin / VOTRE_MOT_DE_PASSE

### 7. Configuration des webhooks Discord

1. **Créez vos webhooks Discord** dans vos serveurs
2. **Copiez les URLs** dans `config.json`
3. **Redémarrez l'application** via cPanel

## Maintenance

### Mise à jour de l'application

1. **Localement, faites vos modifications**
2. **Exécutez** `./scripts/build-and-deploy.sh`
3. **Uploadez uniquement les fichiers modifiés** :
   - `dist/` (si backend modifié)
   - `public/` (si frontend modifié)
4. **Redémarrez l'app** via cPanel

### Sauvegarde

**Sauvegardez régulièrement** :
- `config.json` (contient vos webhooks)
- `logs/` (historique des événements)

## Dépannage

### L'application ne démarre pas

1. **Vérifiez les logs Node.js** dans cPanel
2. **Vérifiez que config.json existe** et est valide
3. **Vérifiez les permissions** : `chmod 644 config.json`

### Erreur 500

1. **Vérifiez le fichier de démarrage** : doit être `dist/app.js`
2. **Vérifiez la version Node.js** : minimum 18
3. **Regardez les logs d'erreur** dans cPanel

### Les webhooks ne fonctionnent pas

1. **Testez via l'interface** : `/test/webhook`
2. **Vérifiez les URLs** dans `config.json`
3. **Vérifiez les permissions Discord** des webhooks

## Support

En cas de problème, vérifiez :
1. **Les logs de l'application** : `logs/` sur le serveur
2. **Les logs Node.js** dans cPanel
3. **La configuration** : `/config` dans l'interface admin