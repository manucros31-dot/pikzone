# PICZONE 🦟

Application mobile React de signalement de moustiques en temps réel, construite avec Vite, Leaflet et Supabase.

## Fonctionnalités

- **Carte interactive** — carte Leaflet centrée sur la France avec géolocalisation GPS de l'utilisateur
- **Zones colorées** — visualisation des signalements par niveau d'infestation
  - 🔴 Rouge — Infesté
  - 🟠 Orange — Beaucoup
  - 🟡 Jaune — Peu
  - 🟢 Vert — Aucun
- **Signalement** — bouton central pour signaler sa zone en un tap
- **Badges** — système de récompenses basé sur le nombre de signalements
  - 🎖️ Guerre aux Moustiques — 1er signalement
  - 🛡️ Anti-Moustiques — 20 signalements
  - 💥 Moustique Destructeur — 40 signalements
- **Design mobile-first** — barre de navigation en bas, compatible iPhone (safe-area)

## Stack technique

| Outil | Rôle |
|-------|------|
| React 19 + Vite | Interface utilisateur |
| react-leaflet | Carte interactive |
| @supabase/supabase-js | Base de données & API |

## Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd piczone

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# Lancer en développement
npm run dev
```

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter le fichier [`supabase/schema.sql`](supabase/schema.sql) dans l'éditeur SQL
3. Copier l'URL et la clé `anon` dans le fichier `.env`

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

> **Important** : ne jamais committer le fichier `.env` (déjà exclu par `.gitignore`)

## Structure du projet

```
src/
├── components/
│   ├── Map.jsx          # Carte Leaflet + zones colorées
│   ├── ReportModal.jsx  # Formulaire de signalement
│   ├── Badges.jsx       # Page des badges
│   └── BottomNav.jsx    # Barre de navigation
├── hooks/
│   └── useGeolocation.js  # Hook GPS
├── lib/
│   └── supabase.js        # Client Supabase + identifiant anonyme
├── App.jsx
└── App.css
supabase/
└── schema.sql  # Schéma de la base de données
```

## Scripts

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run preview  # Prévisualiser le build
```
