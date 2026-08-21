# Suivi candidatures

Application personnelle de suivi de candidatures (Next.js + Prisma +
MariaDB + Docker Compose + NextAuth), destinée dans un premier temps à un
usage local, avec un déploiement futur sur un VPS personnel sous
`emploi.rivierenathan.fr`.

## Démarrage rapide

```bash
cp .env.example .env
# éditer .env si besoin (voir "Avant tout déploiement réel" ci-dessous)

docker compose up --build -d

docker compose exec app npm run prisma:migrate:deploy
docker compose exec app npm run prisma:seed
```

L'application est ensuite disponible sur http://localhost:3000, avec un
compte administrateur créé à partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(voir `.env`).

Pour les tests d'intégration, dupliquer également le fichier d'exemple :

```bash
cp .env.test.example .env.test
```

## Avant tout déploiement réel

Le fichier `.env` fourni par défaut (`.env.example`) contient des valeurs
de développement qui **doivent être changées** avant tout déploiement
réel (VPS ou autre environnement exposé) :

- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — identifiants du compte admin.
- `NEXTAUTH_SECRET` — secret de signature des sessions NextAuth (générer
  une valeur aléatoire, par exemple `openssl rand -base64 32`).
- `MARIADB_ROOT_PASSWORD`, `MARIADB_USER`, `MARIADB_PASSWORD` — les
  identifiants de la base MariaDB. Le port 3306 du service `db` n'est
  publié que sur `127.0.0.1` (voir `docker-compose.yml`), mais des
  identifiants faibles restent un risque si l'accès local à la machine
  n'est pas fiable.

## Workflow de migration Prisma

Le fonctionnement normal pour toute évolution du schéma passe par :

```bash
docker compose exec app npm run prisma:migrate
```

(qui exécute `prisma migrate dev`).

**Limitation connue** : l'utilisateur MySQL `candidatures` n'a pas le
privilège de créer une base de données shadow. `prisma migrate dev`
échouera donc avec l'erreur **P3014** dès qu'un changement de schéma est
nécessaire. Si cela se produit, générer la migration sans shadow database
en diffant le schéma cible contre l'état réel de la base (pas
`--from-empty`, qui regénérerait tout le schéma depuis zéro et échouerait
sur des tables déjà existantes) :

```bash
TS=$(date -u +%Y%m%d%H%M%S)
MIGDIR="prisma/migrations/${TS}_<nom>"
mkdir -p "$MIGDIR"

docker compose exec app npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script \
  > "$MIGDIR/migration.sql"

docker compose exec app npx prisma migrate deploy
```

`migrate deploy` n'a pas besoin de shadow database (contrairement à
`migrate dev`) — il applique simplement les fichiers `migration.sql`
présents dans `prisma/migrations/` qui ne sont pas encore enregistrés
dans `_prisma_migrations`. Si la base a divergé de l'historique des
migrations (ex. après un `db push` accidentel), utiliser en plus
`prisma migrate resolve --applied <nom-de-la-migration>` pour marquer la
migration comme déjà appliquée sans rejouer son SQL — c'est l'approche
utilisée pour la toute première migration (voir le rapport de la tâche 2
dans `.superpowers/sdd/2026-08-20-suivi-candidatures-plan/task-2-report.md`,
non versionné, pour le détail de ce cas particulier).

Après toute évolution du schéma, régénérer le client Prisma :

```bash
docker compose exec app npm run prisma:generate
```

Ceci est nécessaire car le client généré est intégré à l'image Docker au
moment du build (`RUN npx prisma generate` dans le `Dockerfile`) et mis en
cache dans le volume anonyme `/app/node_modules` (voir `docker-compose.yml`) :
il ne se régénère donc pas automatiquement quand le schéma change en
développement.

## Tests

```bash
npm run test:unit
npm run test:integration   # nécessite .env.test, utilise la base candidatures_test
npm run test               # les deux suites l'une après l'autre
```

Ou, depuis le conteneur :

```bash
docker compose exec app npm run test:unit
docker compose exec app npm run test:integration
```

Vérification de la compilation TypeScript et du build de production :

```bash
docker compose exec app npm run typecheck
docker compose exec app npx next build
```

## État du setup Docker actuel

Le setup Docker Compose actuel est **uniquement destiné au développement** :
le conteneur `app` tourne avec `CMD ["npm", "run", "dev"]` et le code source
est monté en bind mount (`.:/app`). Une cible de build/déploiement de
production (Dockerfile multi-stage avec `next build` / `next start`, reverse
proxy, certificat TLS) est intentionnellement hors scope pour l'instant
(voir `docs/superpowers/specs/2026-08-20-suivi-candidatures-design.md`,
section « Hors scope ») et devra être mise en place avant tout déploiement
réel sur le VPS.
