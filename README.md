# HR Manager

Outil de gestion d'équipe — présence, paie, congés, acomptes.
Stack : React + Vite · Supabase · Netlify

---

## Setup en 3 étapes

### 1. Supabase (10 min)

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans **SQL Editor → New Query**
4. Coller et exécuter le contenu de `supabase/schema.sql`
5. Dans **Authentication → Users**, créer votre compte manuellement
   - Email + mot de passe de votre choix
6. Dans **Project Settings → API**, copier :
   - `Project URL`
   - `anon public` key

### 2. Configuration locale

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Remplir avec vos clés Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

```bash
# Installer les dépendances
npm install

# Lancer en local
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

### 3. Déploiement Netlify

1. Pusher le projet sur GitHub
2. Aller sur [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Sélectionner le repo
4. Build settings :
   - Build command : `npm run build`
   - Publish directory : `dist`
5. Dans **Site settings → Environment variables**, ajouter :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. **Deploy site**

URL disponible sur mobile et desktop avec login email/password.

---

## Fonctionnalités

| Page | Description |
|------|-------------|
| Présence | Saisie quotidienne statut + heures, calcul auto heures sup |
| Paie | Fiche de paie mensuelle par employé (brut, sup, acomptes, net) |
| Congés | Gestion des congés avec types et durée auto-calculée |
| Acomptes | Suivi des avances sur salaire |
| Équipe | CRUD employés avec taux horaire |
| Config | Journée standard, multiplicateur heures sup, nom entreprise |

---

## Logique de paie

```
Heures normales  = min(heures_travaillées, journée_standard)
Heures sup       = max(0, heures_travaillées - journée_standard)

Salaire brut     = (heures_normales × taux_horaire)
                 + (heures_sup × taux_horaire × multiplicateur)

Net à payer      = brut − acomptes_du_mois
```

Paramètres modifiables dans **Config** :
- Journée standard (défaut : 8h)
- Multiplicateur heures sup (défaut : ×1.5)
