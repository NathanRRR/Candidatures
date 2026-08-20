# Espace de suivi des candidatures et recherches d'emploi

**Date** : 2026-08-20
**Statut** : Approuvé (en attente de relecture finale utilisateur)

## Contexte et objectif

Nathan cherche un espace personnel pour suivre ses candidatures et sa
recherche d'emploi : où en est chaque candidature, avec qui il est en
contact, les entretiens à venir, et quand relancer. Il s'agit d'une
nouvelle application, déployée à terme sur son VPS personnel sous
`emploi.rivierenathan.fr`, mais utilisable en local dès le départ.

## Approche retenue

Application web full-stack **Next.js (App Router)** avec **Prisma**
comme ORM et **MariaDB** comme base de données, le tout **dockerisé
dès le développement** (via `docker-compose`) pour garantir un
environnement stable et reproductible, identique entre dev et
production.

Deux alternatives ont été écartées :
- Postgres à la place de MariaDB : robustesse équivalente pour ce
  volume d'usage (solo), mais MariaDB était la préférence explicite
  de l'utilisateur.
- Backend séparé du frontend (ex. API dédiée type FastAPI/Express) :
  complexité inutile pour une application mono-utilisateur ; le
  full-stack Next.js couvre tous les besoins sans service
  supplémentaire à maintenir.

## Architecture

- **Next.js (App Router)** : UI React + logique métier via Server
  Actions et route handlers pour l'API interne. Pas de backend séparé.
- **Prisma ORM** connecté à **MariaDB** via le connecteur MySQL.
- **Docker Compose** avec deux services :
  - `app` — l'application Next.js
  - `db` — MariaDB, avec volume persistant pour les données
  - Un volume Docker supplémentaire pour les pièces jointes uploadées
- **Auth** : NextAuth.js, provider "Credentials" (email + mot de
  passe), compte unique. Session en cookie signé. Les erreurs de
  connexion renvoient un message générique (pas d'énumération de
  compte).
- **Déploiement final** : VPS personnel, sous-domaine
  `emploi.rivierenathan.fr`, détails d'infra (reverse proxy, certificat
  TLS, etc.) à définir au moment du déploiement — hors scope de cette
  spec.

## Modèle de données

### `Application` (candidature) — entité centrale
- `entreprise`, `poste`
- `statut` (enum : à_postuler / postulé / entretien / offre / refusé
  / abandonné)
- `dateCandidature`, `lienOffre`
- `salaireMin`, `salaireMax`
- `télétravail` (oui / non / hybride)
- `localisation`
- `typeContrat` (CDI / CDD / freelance / stage / alternance)
- `notes` (texte libre)

### `Contact` (1-N par candidature)
- `nom`, `email`, `téléphone`, `rôle`

### `Relance` (1-N par candidature)
- `date`, `note`
- Sert de base au calcul "dernier contact il y a X jours" pour les
  rappels

### `Entretien` (1-N par candidature)
- `date`, `type` (téléphone / visio / présentiel)
- `notes`, `prochaineÉtape`

### `PièceJointe` (1-N par candidature)
- `nomFichier`, `type` (CV / lettre de motivation / autre)
- `cheminFichier`, `dateUpload`

Chaque candidature centralise donc tout son historique (contacts,
relances, entretiens, fichiers). Le `statut` pilote à la fois les
colonnes de la vue Kanban et les filtres de la vue tableau.

## Fonctionnalités

### Vues (Kanban ↔ Tableau, au choix via toggle)
- **Kanban** : colonnes par statut, cartes déplaçables par
  glisser-déposer (le déplacement met à jour le statut). Chaque carte
  affiche entreprise, poste, date, et un badge si la relance est en
  retard.
- **Tableau** : liste filtrable/triable par entreprise, statut, date,
  type de contrat, avec recherche texte libre.
- Un clic sur une candidature (carte ou ligne) ouvre une fiche détail
  avec onglets : infos générales, contacts, entretiens, relances,
  pièces jointes.

### Rappels / relances
- Seuil configurable (par défaut 10 jours) : si aucune relance/mise à
  jour depuis N jours sur une candidature encore active (statut hors
  refusé/abandonné), badge visuel "à relancer" sur la carte/ligne.
- Bandeau/widget "à relancer" en haut du dashboard listant ces
  candidatures.
- Pas de notification email/push en v1 — signal visuel uniquement à
  l'ouverture de l'app, pour éviter d'ajouter une infra de cron/emailing.

### Tableau de bord / statistiques
- Compteurs par statut.
- Taux de réponse (candidatures avec au moins une relance/réponse ÷
  total postulé).
- Graphique des candidatures dans le temps (par semaine/mois).
- Éventuel top entreprises/secteurs, à évaluer selon le volume de
  données réel une fois l'app utilisée.

### Pièces jointes
- Upload CV / lettre de motivation (PDF, docx) par candidature.
- Stockage sur le volume Docker dédié, téléchargement depuis la fiche
  détail.

## Gestion des erreurs

- Validation des formulaires : Zod côté client **et** revalidation
  côté serveur dans les Server Actions (jamais confiance aveugle au
  client).
- Upload de fichiers : limite de taille (10 Mo) et types acceptés
  (PDF/docx) vérifiés côté serveur avant écriture disque.
- Erreurs base de données (ex. perte de connexion MariaDB) : message
  utilisateur générique, logs détaillés côté conteneur serveur.
- Échec de connexion (auth) : message générique, sans indiquer si
  c'est l'email ou le mot de passe qui est en cause.

## Tests

- Tests unitaires sur la logique métier pure : calcul "à relancer",
  calcul des statistiques du dashboard.
- Tests d'intégration légers sur les Server Actions critiques (CRUD
  candidature, upload fichier), via une base de test MariaDB séparée
  (conteneur ou schema dédié).
- Pas de suite e2e (Playwright) en v1, vu l'usage mono-utilisateur —
  vérification manuelle du parcours principal ; à ajouter si l'usage
  grandit.

## Hors scope (v1)

- Authentification multi-utilisateurs.
- Notifications email/push.
- Détails d'infra du déploiement VPS (reverse proxy, TLS, CI/CD).
- Import automatique d'offres depuis des sites d'emploi.
