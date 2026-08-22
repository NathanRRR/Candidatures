# Espace de suivi des candidatures — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal web app to track job applications (companies, statuses, contacts, interviews, follow-ups, attachments) with Kanban and table views, reminder alerts, and a stats dashboard.

**Architecture:** Next.js (App Router) full-stack app — React UI + Server Actions for all mutations, no separate backend. Prisma ORM against MariaDB. Everything runs via Docker Compose from day one (app + db services) so dev matches the eventual VPS deployment. Single-user auth via NextAuth Credentials provider.

**Tech Stack:** Next.js 14 (App Router, TypeScript, React 18), Prisma + MariaDB (mysql connector), NextAuth v4, Zod, bcryptjs, Vitest (unit + integration tests), Docker Compose.

**Spec:** [docs/superpowers/specs/2026-08-20-suivi-candidatures-design.md](../specs/2026-08-20-suivi-candidatures-design.md)

## Global Constraints

- Full-stack Next.js only — no separate backend service (spec §Approche retenue).
- Database is MariaDB via Prisma's `mysql` connector (spec §Architecture).
- Dockerized from the start via `docker-compose` — `app` + `db` services (spec §Architecture).
- Single-user auth (NextAuth Credentials), generic error message on failed login — never reveal whether the email or password was wrong (spec §Auth, §Gestion des erreurs).
- Attachment uploads: max 10 MB, PDF or DOCX only, validated server-side before writing to disk (spec §Gestion des erreurs).
- No email/push notifications in v1 — reminders are visual-only (spec §Rappels / relances).
- No Playwright/e2e suite in v1 — manual verification of the main flow is sufficient (spec §Tests).
- Default follow-up reminder threshold: 10 days of inactivity on a non-closed application (spec §Rappels / relances).
- Deployment target is `emploi.rivierenathan.fr` on a personal VPS, but infra details (reverse proxy, TLS, CI/CD) are out of scope for this plan (spec §Hors scope).

---

## File Structure

```
docker-compose.yml
Dockerfile
docker/init-test-db.sql
.env.example
.env.test.example
package.json
tsconfig.json
next.config.js
vitest.config.ts
prisma/
  schema.prisma
  seed.ts
src/
  lib/
    prisma.ts
    auth.ts
    reminders.ts
    stats.ts
    validations.ts
  actions/
    applications.ts
    contacts.ts
    relances.ts
    entretiens.ts
    attachments.ts
  components/
    BoardView.tsx
    ApplicationTable.tsx
    KanbanBoard.tsx
    ApplicationForm.tsx
    ApplicationDetailTabs.tsx
    DashboardStats.tsx
    ReminderBanner.tsx
  app/
    layout.tsx
    globals.css
    login/page.tsx
    page.tsx
    applications/new/page.tsx
    applications/[id]/page.tsx
    dashboard/page.tsx
    api/auth/[...nextauth]/route.ts
    api/attachments/[id]/route.ts
  middleware.ts
tests/
  unit/
    reminders.test.ts
    stats.test.ts
    validations.test.ts
  integration/
    applications.actions.test.ts
    subresources.actions.test.ts
    attachments.actions.test.ts
    auth.test.ts
```

---

### Task 1: Project scaffolding & Docker environment

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `.env.example`, `.env.test.example`
- Create: `docker-compose.yml`, `Dockerfile`, `docker/init-test-db.sql`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx` (placeholder)
- Create: `.gitignore`

**Interfaces:**
- Produces: a running `docker compose up` stack — `app` service on port 3000 serving Next.js, `db` service (MariaDB) with databases `candidatures` and `candidatures_test`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "suivi-candidatures",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:unit": "vitest run tests/unit",
    "test:integration": "dotenv -e .env.test -- vitest run tests/integration",
    "test": "npm run test:unit && npm run test:integration",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "tsx prisma/seed.ts",
    "test:db:push": "dotenv -e .env.test -- prisma db push"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.18.0",
    "next-auth": "^4.24.7",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^5.18.0",
    "vitest": "^2.0.0",
    "tsx": "^4.16.0",
    "dotenv-cli": "^7.4.2"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
```

- [ ] **Step 4: Create `.env.example` and `.env.test.example`**

`.env.example`:
```
DATABASE_URL="mysql://candidatures:candidatures@db:3306/candidatures"
NEXTAUTH_SECRET="change-me-to-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-me"
UPLOAD_DIR="/app/uploads"
```

`.env.test.example`:
```
DATABASE_URL="mysql://candidatures:candidatures@db:3306/candidatures_test"
UPLOAD_DIR="/tmp/candidatures-uploads-test"
```

- [ ] **Step 5: Create `docker/init-test-db.sql`**

```sql
CREATE DATABASE IF NOT EXISTS candidatures_test;
GRANT ALL PRIVILEGES ON candidatures_test.* TO 'candidatures'@'%';
FLUSH PRIVILEGES;
```

- [ ] **Step 6: Create `Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

- [ ] **Step 7: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: mariadb:11
    restart: unless-stopped
    environment:
      MARIADB_ROOT_PASSWORD: root
      MARIADB_DATABASE: candidatures
      MARIADB_USER: candidatures
      MARIADB_PASSWORD: candidatures
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
      - ./docker/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - .:/app
      - /app/node_modules
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy

volumes:
  db_data:
  uploads_data:
```

- [ ] **Step 8: Create minimal app shell**

`src/app/globals.css`:
```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f5f5f7;
  color: #1a1a1a;
}
```

`src/app/layout.tsx`:
```tsx
import "./globals.css";

export const metadata = {
  title: "Suivi candidatures",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx` (placeholder, replaced in Task 10):
```tsx
export default function HomePage() {
  return <main>Suivi candidatures — en construction</main>;
}
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules
.next
.env
.env.test
*.log
/uploads
```

- [ ] **Step 10: Copy `.env.example` to `.env` and `.env.test.example` to `.env.test` locally, then build and start the stack**

```bash
cp .env.example .env
cp .env.test.example .env.test
docker compose up --build -d
docker compose logs app --tail=50
```

Expected: `app` logs show `Next.js` dev server ready on port 3000, `db` service healthy. Visiting `http://localhost:3000` shows "Suivi candidatures — en construction".

- [ ] **Step 11: Commit**

```bash
git add package.json tsconfig.json next.config.js .env.example .env.test.example docker-compose.yml Dockerfile docker/init-test-db.sql src/app/layout.tsx src/app/globals.css src/app/page.tsx .gitignore
git commit -m "chore: scaffold Next.js project with Docker Compose and MariaDB"
```

---

### Task 2: Prisma schema and data model

**Files:**
- Create: `prisma/schema.prisma`
- Create: `tests/integration/schema.test.ts`
- Modify: `package.json` (no change needed, scripts already added in Task 1)

**Interfaces:**
- Produces: Prisma Client models `User`, `Application`, `Contact`, `Relance`, `Entretien`, `PieceJointe`, and enums `Statut`, `Teletravail`, `TypeContrat`, `TypeEntretien`, `TypePieceJointe`, generated at `@prisma/client`.

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

enum Statut {
  A_POSTULER
  POSTULE
  ENTRETIEN
  OFFRE
  REFUSE
  ABANDONNE
}

enum Teletravail {
  OUI
  NON
  HYBRIDE
}

enum TypeContrat {
  CDI
  CDD
  FREELANCE
  STAGE
  ALTERNANCE
}

enum TypeEntretien {
  TELEPHONE
  VISIO
  PRESENTIEL
}

enum TypePieceJointe {
  CV
  LETTRE_MOTIVATION
  AUTRE
}

model Application {
  id              String        @id @default(uuid())
  entreprise      String
  poste           String
  statut          Statut        @default(A_POSTULER)
  dateCandidature DateTime
  lienOffre       String?
  salaireMin      Int?
  salaireMax      Int?
  teletravail     Teletravail?
  localisation    String?
  typeContrat     TypeContrat?
  notes           String?       @db.Text
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  contacts      Contact[]
  relances      Relance[]
  entretiens    Entretien[]
  piecesJointes PieceJointe[]
}

model Contact {
  id            String      @id @default(uuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  nom           String
  email         String?
  telephone     String?
  role          String?
  createdAt     DateTime    @default(now())
}

model Relance {
  id            String      @id @default(uuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  date          DateTime
  note          String?     @db.Text
  createdAt     DateTime    @default(now())
}

model Entretien {
  id             String        @id @default(uuid())
  applicationId  String
  application    Application   @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  date           DateTime
  type           TypeEntretien
  notes          String?       @db.Text
  prochaineEtape String?
  createdAt      DateTime      @default(now())
}

model PieceJointe {
  id            String          @id @default(uuid())
  applicationId String
  application   Application     @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  nomFichier    String
  type          TypePieceJointe
  cheminFichier String
  dateUpload    DateTime        @default(now())
}
```

- [ ] **Step 2: Create `vitest.config.ts` (needed to run the test below)**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Write the failing integration test**

`tests/integration/schema.test.ts`:
```ts
import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("prisma schema", () => {
  it("creates an application with nested contact, relance, entretien, and pieceJointe", async () => {
    const app = await prisma.application.create({
      data: {
        entreprise: "Acme",
        poste: "Développeur",
        dateCandidature: new Date("2026-08-01"),
        contacts: { create: { nom: "Jane Doe", email: "jane@acme.com" } },
        relances: { create: { date: new Date("2026-08-10"), note: "Email de relance" } },
        entretiens: { create: { date: new Date("2026-08-15"), type: "VISIO" } },
        piecesJointes: {
          create: { nomFichier: "cv.pdf", type: "CV", cheminFichier: "test/cv.pdf" },
        },
      },
      include: { contacts: true, relances: true, entretiens: true, piecesJointes: true },
    });

    expect(app.statut).toBe("A_POSTULER");
    expect(app.contacts).toHaveLength(1);
    expect(app.relances).toHaveLength(1);
    expect(app.entretiens).toHaveLength(1);
    expect(app.piecesJointes).toHaveLength(1);

    await prisma.application.delete({ where: { id: app.id } });
  });
});
```

- [ ] **Step 4: Push the schema to the test database and generate the client**

```bash
docker compose exec app npm run prisma:generate
docker compose exec app npm run test:db:push
```

Expected: `prisma db push` reports the schema was applied to `candidatures_test` and Prisma Client was generated.

- [ ] **Step 5: Run the test to verify it passes**

```bash
docker compose exec app npm run test:integration
```

Expected: PASS — `prisma schema > creates an application with nested contact, relance, entretien, and pieceJointe`.

- [ ] **Step 6: Apply the same schema to the dev database**

```bash
docker compose exec app npm run prisma:migrate -- --name init
```

Expected: a migration is created under `prisma/migrations/` and applied to `candidatures` (the dev database).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations vitest.config.ts tests/integration/schema.test.ts
git commit -m "feat: add Prisma schema for applications, contacts, relances, entretiens, attachments"
```

---

### Task 3: Validation schemas (Zod)

**Files:**
- Create: `src/lib/validations.ts`
- Test: `tests/unit/validations.test.ts`

**Interfaces:**
- Consumes: enums from `@prisma/client` (`Statut`, `Teletravail`, `TypeContrat`, `TypeEntretien`, `TypePieceJointe`).
- Produces: `applicationInputSchema`, `ApplicationInput`, `contactInputSchema`, `ContactInput`, `relanceInputSchema`, `RelanceInput`, `entretienInputSchema`, `EntretienInput` — consumed by Tasks 7 and 8.

- [ ] **Step 1: Write the failing test**

`tests/unit/validations.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { applicationInputSchema, contactInputSchema, relanceInputSchema, entretienInputSchema } from "@/lib/validations";

describe("applicationInputSchema", () => {
  it("accepts a minimal valid application and defaults statut", () => {
    const result = applicationInputSchema.parse({
      entreprise: "Acme",
      poste: "Développeur",
      dateCandidature: "2026-08-01",
    });
    expect(result.statut).toBe("A_POSTULER");
    expect(result.dateCandidature).toBeInstanceOf(Date);
  });

  it("rejects a missing entreprise", () => {
    expect(() =>
      applicationInputSchema.parse({ poste: "Développeur", dateCandidature: "2026-08-01" })
    ).toThrow();
  });
});

describe("contactInputSchema", () => {
  it("requires applicationId and nom", () => {
    expect(() => contactInputSchema.parse({ nom: "Jane" })).toThrow();
  });
});

describe("relanceInputSchema", () => {
  it("requires applicationId and date", () => {
    expect(() => relanceInputSchema.parse({ note: "test" })).toThrow();
  });
});

describe("entretienInputSchema", () => {
  it("requires a valid type", () => {
    expect(() =>
      entretienInputSchema.parse({
        applicationId: "11111111-1111-1111-1111-111111111111",
        date: "2026-08-15",
        type: "INVALID",
      })
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose exec app npm run test:unit
```

Expected: FAIL with "Cannot find module '@/lib/validations'".

- [ ] **Step 3: Write `src/lib/validations.ts`**

```ts
import { z } from "zod";

export const applicationInputSchema = z.object({
  entreprise: z.string().min(1, "L'entreprise est requise"),
  poste: z.string().min(1, "Le poste est requis"),
  statut: z
    .enum(["A_POSTULER", "POSTULE", "ENTRETIEN", "OFFRE", "REFUSE", "ABANDONNE"])
    .default("A_POSTULER"),
  dateCandidature: z.coerce.date(),
  lienOffre: z.string().url().optional().or(z.literal("")),
  salaireMin: z.coerce.number().int().nonnegative().optional(),
  salaireMax: z.coerce.number().int().nonnegative().optional(),
  teletravail: z.enum(["OUI", "NON", "HYBRIDE"]).optional(),
  localisation: z.string().optional(),
  typeContrat: z.enum(["CDI", "CDD", "FREELANCE", "STAGE", "ALTERNANCE"]).optional(),
  notes: z.string().optional(),
});
export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export const contactInputSchema = z.object({
  applicationId: z.string().uuid(),
  nom: z.string().min(1, "Le nom est requis"),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  role: z.string().optional(),
});
export type ContactInput = z.infer<typeof contactInputSchema>;

export const relanceInputSchema = z.object({
  applicationId: z.string().uuid(),
  date: z.coerce.date(),
  note: z.string().optional(),
});
export type RelanceInput = z.infer<typeof relanceInputSchema>;

export const entretienInputSchema = z.object({
  applicationId: z.string().uuid(),
  date: z.coerce.date(),
  type: z.enum(["TELEPHONE", "VISIO", "PRESENTIEL"]),
  notes: z.string().optional(),
  prochaineEtape: z.string().optional(),
});
export type EntretienInput = z.infer<typeof entretienInputSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
docker compose exec app npm run test:unit
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations.ts tests/unit/validations.test.ts
git commit -m "feat: add Zod validation schemas for application and sub-resource inputs"
```

---

### Task 4: Reminder logic (relances en retard)

**Files:**
- Create: `src/lib/reminders.ts`
- Test: `tests/unit/reminders.test.ts`

**Interfaces:**
- Produces: `estARelancer(app: ApplicationForReminder, seuilJours: number, maintenant: Date): boolean` and `SEUIL_RELANCE_JOURS_DEFAUT = 10` — consumed by Task 13 (dashboard).

- [ ] **Step 1: Write the failing test**

`tests/unit/reminders.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { estARelancer, SEUIL_RELANCE_JOURS_DEFAUT } from "@/lib/reminders";

const maintenant = new Date("2026-08-20T00:00:00Z");

describe("estARelancer", () => {
  it("is false for a closed application even if long inactive", () => {
    const app = {
      statut: "REFUSE",
      dateCandidature: new Date("2026-07-01"),
      relances: [],
    };
    expect(estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant)).toBe(false);
  });

  it("is true when no relance and dateCandidature is older than the threshold", () => {
    const app = {
      statut: "POSTULE",
      dateCandidature: new Date("2026-08-01"),
      relances: [],
    };
    expect(estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant)).toBe(true);
  });

  it("is false when the most recent relance is within the threshold", () => {
    const app = {
      statut: "POSTULE",
      dateCandidature: new Date("2026-07-01"),
      relances: [{ date: new Date("2026-08-15") }],
    };
    expect(estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant)).toBe(false);
  });

  it("is true when the most recent relance is older than the threshold", () => {
    const app = {
      statut: "POSTULE",
      dateCandidature: new Date("2026-07-01"),
      relances: [{ date: new Date("2026-07-05") }, { date: new Date("2026-07-20") }],
    };
    expect(estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose exec app npm run test:unit
```

Expected: FAIL with "Cannot find module '@/lib/reminders'".

- [ ] **Step 3: Write `src/lib/reminders.ts`**

```ts
export const SEUIL_RELANCE_JOURS_DEFAUT = 10;

const STATUTS_ACTIFS = new Set(["A_POSTULER", "POSTULE", "ENTRETIEN", "OFFRE"]);

export interface ApplicationForReminder {
  statut: string;
  dateCandidature: Date;
  relances: { date: Date }[];
}

export function estARelancer(
  app: ApplicationForReminder,
  seuilJours: number,
  maintenant: Date
): boolean {
  if (!STATUTS_ACTIFS.has(app.statut)) return false;

  const dernierContact = app.relances.reduce(
    (latest, r) => (r.date > latest ? r.date : latest),
    app.dateCandidature
  );

  const joursDepuis = (maintenant.getTime() - dernierContact.getTime()) / (1000 * 60 * 60 * 24);
  return joursDepuis >= seuilJours;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
docker compose exec app npm run test:unit
```

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reminders.ts tests/unit/reminders.test.ts
git commit -m "feat: add follow-up reminder calculation logic"
```

---

### Task 5: Dashboard stats logic

**Files:**
- Create: `src/lib/stats.ts`
- Test: `tests/unit/stats.test.ts`

**Interfaces:**
- Produces: `computeDashboardStats(apps: ApplicationForStats[]): DashboardStats` — consumed by Task 13 (dashboard).

- [ ] **Step 1: Write the failing test**

`tests/unit/stats.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeDashboardStats } from "@/lib/stats";

describe("computeDashboardStats", () => {
  it("counts applications per statut", () => {
    const stats = computeDashboardStats([
      { statut: "A_POSTULER" },
      { statut: "POSTULE" },
      { statut: "POSTULE" },
      { statut: "ENTRETIEN" },
    ]);
    expect(stats.parStatut).toEqual({ A_POSTULER: 1, POSTULE: 2, ENTRETIEN: 1 });
    expect(stats.total).toBe(4);
  });

  it("computes tauxReponse as responded applications over applications applied", () => {
    const stats = computeDashboardStats([
      { statut: "A_POSTULER" },
      { statut: "POSTULE" },
      { statut: "ENTRETIEN" },
      { statut: "REFUSE" },
      { statut: "OFFRE" },
    ]);
    // postulees (statut != A_POSTULER): POSTULE, ENTRETIEN, REFUSE, OFFRE = 4
    // avec reponse (ENTRETIEN, OFFRE, REFUSE): 3
    expect(stats.tauxReponse).toBeCloseTo(3 / 4);
  });

  it("returns tauxReponse 0 when nothing has been applied to yet", () => {
    const stats = computeDashboardStats([{ statut: "A_POSTULER" }]);
    expect(stats.tauxReponse).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose exec app npm run test:unit
```

Expected: FAIL with "Cannot find module '@/lib/stats'".

- [ ] **Step 3: Write `src/lib/stats.ts`**

```ts
export interface ApplicationForStats {
  statut: string;
}

export interface DashboardStats {
  parStatut: Record<string, number>;
  total: number;
  tauxReponse: number;
}

const STATUTS_REPONSE = new Set(["ENTRETIEN", "OFFRE", "REFUSE"]);

export function computeDashboardStats(apps: ApplicationForStats[]): DashboardStats {
  const parStatut: Record<string, number> = {};
  for (const app of apps) {
    parStatut[app.statut] = (parStatut[app.statut] ?? 0) + 1;
  }

  const postulees = apps.filter((a) => a.statut !== "A_POSTULER");
  const avecReponse = postulees.filter((a) => STATUTS_REPONSE.has(a.statut));
  const tauxReponse = postulees.length > 0 ? avecReponse.length / postulees.length : 0;

  return { parStatut, total: apps.length, tauxReponse };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
docker compose exec app npm run test:unit
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats.ts tests/unit/stats.test.ts
git commit -m "feat: add dashboard stats calculation logic"
```

---

### Task 6: Authentication (NextAuth Credentials, single user)

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `src/lib/auth.ts`
- Create: `prisma/seed.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/middleware.ts`
- Test: `tests/integration/auth.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma` (Task 2 models).
- Produces: `prisma` singleton (`@/lib/prisma`), `authOptions: NextAuthOptions` and `verifyCredentials(email, password): Promise<{id, email} | null>` from `@/lib/auth` — consumed by the NextAuth route handler and by every protected page/action via `getServerSession(authOptions)`.

- [ ] **Step 1: Write `src/lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Write the failing integration test for credential verification**

`tests/integration/auth.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyCredentials } from "@/lib/auth";

beforeAll(async () => {
  await prisma.user.deleteMany();
  await prisma.user.create({
    data: {
      email: "nathan@example.com",
      passwordHash: await bcrypt.hash("bonMotDePasse", 10),
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany();
});

describe("verifyCredentials", () => {
  it("returns the user when email and password match", async () => {
    const user = await verifyCredentials("nathan@example.com", "bonMotDePasse");
    expect(user).toEqual({ id: expect.any(String), email: "nathan@example.com" });
  });

  it("returns null when the password is wrong", async () => {
    const user = await verifyCredentials("nathan@example.com", "mauvaisMotDePasse");
    expect(user).toBeNull();
  });

  it("returns null when the email is unknown", async () => {
    const user = await verifyCredentials("inconnu@example.com", "peuImporte");
    expect(user).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
docker compose exec app npm run test:integration
```

Expected: FAIL with "Cannot find module '@/lib/auth'".

- [ ] **Step 4: Write `src/lib/auth.ts`**

```ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        return verifyCredentials(credentials.email, credentials.password);
      },
    }),
  ],
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
docker compose exec app npm run test:integration
```

Expected: PASS — all 3 tests in `verifyCredentials` green.

- [ ] **Step 6: Write `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans .env");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  console.log(`Utilisateur admin créé/mis à jour : ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 7: Write `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

- [ ] **Step 8: Write `src/app/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setErreur("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/");
  }

  return (
    <main style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {erreur && <p role="alert">{erreur}</p>}
        <button type="submit">Se connecter</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 9: Write `src/middleware.ts`**

```ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 10: Manually verify the login flow**

```bash
docker compose exec app npm run prisma:seed
docker compose restart app
```

Expected: visiting `http://localhost:3000/` redirects to `/login`. Logging in with `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env` redirects to `/` and shows the placeholder page. Logging in with a wrong password shows "Email ou mot de passe incorrect."

- [ ] **Step 11: Commit**

```bash
git add src/lib/prisma.ts src/lib/auth.ts prisma/seed.ts src/app/api/auth src/app/login src/middleware.ts tests/integration/auth.test.ts
git commit -m "feat: add single-user credentials auth with NextAuth"
```

---

### Task 7: Server Actions — Application CRUD

**Files:**
- Create: `src/actions/applications.ts`
- Test: `tests/integration/applications.actions.test.ts`

**Interfaces:**
- Consumes: `prisma` (`@/lib/prisma`), `applicationInputSchema`/`ApplicationInput` (`@/lib/validations`).
- Produces: `createApplication(input: ApplicationInput)`, `updateApplicationStatut(id: string, statut: Statut)`, `listApplications()`, `getApplication(id: string)`, `deleteApplication(id: string)` — consumed by Tasks 10, 11, 12, 13.

- [ ] **Step 1: Write the failing test**

`tests/integration/applications.actions.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createApplication,
  updateApplicationStatut,
  listApplications,
  getApplication,
  deleteApplication,
} from "@/actions/applications";

beforeEach(async () => {
  await prisma.application.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("applications server actions", () => {
  it("creates an application with default statut A_POSTULER", async () => {
    const app = await createApplication({
      entreprise: "Acme",
      poste: "Développeur",
      dateCandidature: new Date("2026-08-01"),
    } as any);
    expect(app.statut).toBe("A_POSTULER");
    expect(app.entreprise).toBe("Acme");
  });

  it("updates the statut", async () => {
    const app = await createApplication({
      entreprise: "Acme",
      poste: "Développeur",
      dateCandidature: new Date("2026-08-01"),
    } as any);
    const updated = await updateApplicationStatut(app.id, "ENTRETIEN");
    expect(updated.statut).toBe("ENTRETIEN");
  });

  it("lists all applications", async () => {
    await createApplication({ entreprise: "A", poste: "X", dateCandidature: new Date() } as any);
    await createApplication({ entreprise: "B", poste: "Y", dateCandidature: new Date() } as any);
    const apps = await listApplications();
    expect(apps).toHaveLength(2);
  });

  it("gets an application with its relations", async () => {
    const app = await createApplication({ entreprise: "A", poste: "X", dateCandidature: new Date() } as any);
    const found = await getApplication(app.id);
    expect(found?.contacts).toEqual([]);
    expect(found?.relances).toEqual([]);
  });

  it("deletes an application", async () => {
    const app = await createApplication({ entreprise: "A", poste: "X", dateCandidature: new Date() } as any);
    await deleteApplication(app.id);
    expect(await getApplication(app.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose exec app npm run test:integration
```

Expected: FAIL with "Cannot find module '@/actions/applications'".

- [ ] **Step 3: Write `src/actions/applications.ts`**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { applicationInputSchema, type ApplicationInput } from "@/lib/validations";
import type { Statut } from "@prisma/client";

export async function createApplication(input: ApplicationInput) {
  const data = applicationInputSchema.parse(input);
  return prisma.application.create({ data });
}

export async function updateApplicationStatut(id: string, statut: Statut) {
  return prisma.application.update({ where: { id }, data: { statut } });
}

export async function listApplications() {
  return prisma.application.findMany({
    include: { relances: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplication(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: { contacts: true, relances: true, entretiens: true, piecesJointes: true },
  });
}

export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
docker compose exec app npm run test:integration
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/actions/applications.ts tests/integration/applications.actions.test.ts
git commit -m "feat: add application CRUD server actions"
```

---

### Task 8: Server Actions — Contacts, Relances, Entretiens

**Files:**
- Create: `src/actions/contacts.ts`, `src/actions/relances.ts`, `src/actions/entretiens.ts`
- Test: `tests/integration/subresources.actions.test.ts`

**Interfaces:**
- Consumes: `prisma`, `contactInputSchema`/`ContactInput`, `relanceInputSchema`/`RelanceInput`, `entretienInputSchema`/`EntretienInput` (`@/lib/validations`), `createApplication` (`@/actions/applications`, for test setup).
- Produces: `addContact(input: ContactInput)`, `addRelance(input: RelanceInput)`, `addEntretien(input: EntretienInput)` — consumed by Task 12 (detail page).

- [ ] **Step 1: Write the failing test**

`tests/integration/subresources.actions.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createApplication } from "@/actions/applications";
import { addContact } from "@/actions/contacts";
import { addRelance } from "@/actions/relances";
import { addEntretien } from "@/actions/entretiens";

beforeEach(async () => {
  await prisma.application.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function makeApplication() {
  return createApplication({ entreprise: "Acme", poste: "Développeur", dateCandidature: new Date() } as any);
}

describe("addContact", () => {
  it("attaches a contact to an application", async () => {
    const app = await makeApplication();
    const contact = await addContact({ applicationId: app.id, nom: "Jane Doe", email: "jane@acme.com" } as any);
    expect(contact.applicationId).toBe(app.id);
    expect(contact.nom).toBe("Jane Doe");
  });
});

describe("addRelance", () => {
  it("attaches a relance to an application", async () => {
    const app = await makeApplication();
    const relance = await addRelance({ applicationId: app.id, date: new Date("2026-08-10") } as any);
    expect(relance.applicationId).toBe(app.id);
  });
});

describe("addEntretien", () => {
  it("attaches an entretien to an application", async () => {
    const app = await makeApplication();
    const entretien = await addEntretien({
      applicationId: app.id,
      date: new Date("2026-08-15"),
      type: "VISIO",
    } as any);
    expect(entretien.applicationId).toBe(app.id);
    expect(entretien.type).toBe("VISIO");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose exec app npm run test:integration
```

Expected: FAIL with "Cannot find module '@/actions/contacts'".

- [ ] **Step 3: Write `src/actions/contacts.ts`**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { contactInputSchema, type ContactInput } from "@/lib/validations";

export async function addContact(input: ContactInput) {
  const data = contactInputSchema.parse(input);
  return prisma.contact.create({ data });
}
```

- [ ] **Step 4: Write `src/actions/relances.ts`**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { relanceInputSchema, type RelanceInput } from "@/lib/validations";

export async function addRelance(input: RelanceInput) {
  const data = relanceInputSchema.parse(input);
  return prisma.relance.create({ data });
}
```

- [ ] **Step 5: Write `src/actions/entretiens.ts`**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { entretienInputSchema, type EntretienInput } from "@/lib/validations";

export async function addEntretien(input: EntretienInput) {
  const data = entretienInputSchema.parse(input);
  return prisma.entretien.create({ data });
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
docker compose exec app npm run test:integration
```

Expected: PASS — all 3 tests green.

- [ ] **Step 7: Commit**

```bash
git add src/actions/contacts.ts src/actions/relances.ts src/actions/entretiens.ts tests/integration/subresources.actions.test.ts
git commit -m "feat: add server actions for contacts, relances, and entretiens"
```

---

### Task 9: Server Actions — Attachments (upload + download)

**Files:**
- Create: `src/actions/attachments.ts`
- Create: `src/app/api/attachments/[id]/route.ts`
- Test: `tests/integration/attachments.actions.test.ts`

**Interfaces:**
- Consumes: `prisma`, `createApplication` (test setup), `authOptions` (`@/lib/auth`, for the download route).
- Produces: `uploadAttachment(applicationId: string, type: "CV" | "LETTRE_MOTIVATION" | "AUTRE", file: File)`, `AttachmentValidationError` — consumed by Task 12 (detail page).

- [ ] **Step 1: Write the failing test**

`tests/integration/attachments.actions.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import os from "node:os";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { createApplication } from "@/actions/applications";
import { uploadAttachment, AttachmentValidationError } from "@/actions/attachments";

beforeEach(async () => {
  await prisma.application.deleteMany();
  process.env.UPLOAD_DIR = path.join(os.tmpdir(), "candidatures-uploads-test");
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function makeApplication() {
  return createApplication({ entreprise: "Acme", poste: "Développeur", dateCandidature: new Date() } as any);
}

describe("uploadAttachment", () => {
  it("stores a valid PDF and creates a PieceJointe row", async () => {
    const app = await makeApplication();
    const file = new File([new Uint8Array([1, 2, 3])], "cv.pdf", { type: "application/pdf" });
    const piece = await uploadAttachment(app.id, "CV", file);
    expect(piece.nomFichier).toBe("cv.pdf");
    expect(piece.type).toBe("CV");
  });

  it("rejects a file that is too large", async () => {
    const app = await makeApplication();
    const bigContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([bigContent], "cv.pdf", { type: "application/pdf" });
    await expect(uploadAttachment(app.id, "CV", file)).rejects.toThrow(AttachmentValidationError);
  });

  it("rejects a disallowed file type", async () => {
    const app = await makeApplication();
    const file = new File([new Uint8Array([1])], "cv.exe", { type: "application/x-msdownload" });
    await expect(uploadAttachment(app.id, "CV", file)).rejects.toThrow(AttachmentValidationError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose exec app npm run test:integration
```

Expected: FAIL with "Cannot find module '@/actions/attachments'".

- [ ] **Step 3: Write `src/actions/attachments.ts`**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export class AttachmentValidationError extends Error {}

export async function uploadAttachment(
  applicationId: string,
  type: "CV" | "LETTRE_MOTIVATION" | "AUTRE",
  file: File
) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new AttachmentValidationError("Le fichier dépasse la taille maximale de 10 Mo");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new AttachmentValidationError("Seuls les fichiers PDF et DOCX sont acceptés");
  }

  const uploadRoot = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  const dir = path.join(uploadRoot, applicationId);
  await mkdir(dir, { recursive: true });

  const fileName = `${randomUUID()}-${file.name}`;
  const filePath = path.join(dir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return prisma.pieceJointe.create({
    data: {
      applicationId,
      nomFichier: file.name,
      type,
      cheminFichier: path.join(applicationId, fileName),
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
docker compose exec app npm run test:integration
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Write the download route `src/app/api/attachments/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const piece = await prisma.pieceJointe.findUnique({ where: { id: params.id } });
  if (!piece) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const uploadRoot = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  const buffer = await readFile(path.join(uploadRoot, piece.cheminFichier));

  return new NextResponse(buffer, {
    headers: { "Content-Disposition": `attachment; filename="${piece.nomFichier}"` },
  });
}
```

This route is a thin I/O wrapper around already-tested logic (`prisma`, `readFile`) and requires a real authenticated request context, so it is verified manually in Task 14's end-to-end smoke test rather than with an automated test.

- [ ] **Step 6: Commit**

```bash
git add src/actions/attachments.ts src/app/api/attachments tests/integration/attachments.actions.test.ts
git commit -m "feat: add attachment upload and download"
```

---

### Task 10: UI — Table view

**Files:**
- Create: `src/components/ApplicationTable.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `listApplications()` (`@/actions/applications`), `estARelancer` + `SEUIL_RELANCE_JOURS_DEFAUT` (`@/lib/reminders`).
- Produces: `<ApplicationTable applications={...} />` client component — consumed by Task 11 (`BoardView` toggle wraps both Table and Kanban).

No automated test for this task (pure presentational UI, per the spec's decision to skip component/e2e testing in v1) — verified manually per Step 3.

- [ ] **Step 1: Write `src/components/ApplicationTable.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface ApplicationRow {
  id: string;
  entreprise: string;
  poste: string;
  statut: string;
  dateCandidature: string;
  typeContrat: string | null;
  aRelancer: boolean;
}

const STATUTS = ["A_POSTULER", "POSTULE", "ENTRETIEN", "OFFRE", "REFUSE", "ABANDONNE"];

export function ApplicationTable({ applications }: { applications: ApplicationRow[] }) {
  const [filtreStatut, setFiltreStatut] = useState<string>("TOUS");
  const [recherche, setRecherche] = useState("");

  const filtrees = useMemo(() => {
    return applications.filter((app) => {
      const matchStatut = filtreStatut === "TOUS" || app.statut === filtreStatut;
      const matchRecherche = app.entreprise.toLowerCase().includes(recherche.toLowerCase());
      return matchStatut && matchRecherche;
    });
  }, [applications, filtreStatut, recherche]);

  return (
    <div>
      <div>
        <input
          placeholder="Rechercher une entreprise..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
          <option value="TOUS">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Entreprise</th>
            <th>Poste</th>
            <th>Statut</th>
            <th>Date</th>
            <th>Contrat</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtrees.map((app) => (
            <tr key={app.id}>
              <td>{app.entreprise}</td>
              <td>{app.poste}</td>
              <td>{app.statut}</td>
              <td>{app.dateCandidature}</td>
              <td>{app.typeContrat ?? "—"}</td>
              <td>
                {app.aRelancer && <span title="À relancer">⚠️</span>}
                <Link href={`/applications/${app.id}`}>Voir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `src/app/page.tsx`**

```tsx
import { listApplications } from "@/actions/applications";
import { estARelancer, SEUIL_RELANCE_JOURS_DEFAUT } from "@/lib/reminders";
import { ApplicationTable } from "@/components/ApplicationTable";
import Link from "next/link";

export default async function HomePage() {
  const applications = await listApplications();
  const maintenant = new Date();

  const rows = applications.map((app) => ({
    id: app.id,
    entreprise: app.entreprise,
    poste: app.poste,
    statut: app.statut,
    dateCandidature: app.dateCandidature.toISOString().slice(0, 10),
    typeContrat: app.typeContrat,
    aRelancer: estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant),
  }));

  return (
    <main>
      <h1>Mes candidatures</h1>
      <p>
        <Link href="/applications/new">+ Nouvelle candidature</Link> ·{" "}
        <Link href="/dashboard">Tableau de bord</Link>
      </p>
      <ApplicationTable applications={rows} />
    </main>
  );
}
```

- [ ] **Step 3: Manually verify**

```bash
docker compose exec app npm run prisma:seed
docker compose restart app
```

Log in at `http://localhost:3000/login`, then on `/` confirm: the table renders (empty at first), the search box filters by entreprise, and the statut dropdown filters correctly. Use `docker compose exec db mariadb -ucandidatures -pcandidatures candidatures` to manually insert a test row if needed, or wait until Task 12 provides the creation form.

- [ ] **Step 4: Commit**

```bash
git add src/components/ApplicationTable.tsx src/app/page.tsx
git commit -m "feat: add filterable table view of applications"
```

---

### Task 11: UI — Kanban view + view toggle

**Files:**
- Create: `src/components/KanbanBoard.tsx`
- Create: `src/components/BoardView.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `ApplicationRow` (`@/components/ApplicationTable`), `updateApplicationStatut` (`@/actions/applications`).
- Produces: `<BoardView applications={...} />` — replaces the direct `<ApplicationTable />` usage in `src/app/page.tsx`.

- [ ] **Step 1: Write `src/components/KanbanBoard.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateApplicationStatut } from "@/actions/applications";
import type { ApplicationRow } from "./ApplicationTable";

const COLONNES: { statut: string; label: string }[] = [
  { statut: "A_POSTULER", label: "À postuler" },
  { statut: "POSTULE", label: "Postulé" },
  { statut: "ENTRETIEN", label: "Entretien" },
  { statut: "OFFRE", label: "Offre" },
  { statut: "REFUSE", label: "Refusé" },
  { statut: "ABANDONNE", label: "Abandonné" },
];

export function KanbanBoard({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDrop(statut: string) {
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    startTransition(async () => {
      await updateApplicationStatut(id, statut as any);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {COLONNES.map((col) => (
        <div
          key={col.statut}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.statut)}
          style={{ flex: 1, background: "#fff", padding: 8, borderRadius: 8, minHeight: 200 }}
        >
          <h3>{col.label}</h3>
          {applications
            .filter((app) => app.statut === col.statut)
            .map((app) => (
              <div
                key={app.id}
                draggable
                onDragStart={() => setDragId(app.id)}
                style={{ background: "#f0f0f2", padding: 8, marginBottom: 8, borderRadius: 6 }}
              >
                <strong>{app.entreprise}</strong>
                <div>{app.poste}</div>
                {app.aRelancer && <span title="À relancer">⚠️</span>}
                <div>
                  <Link href={`/applications/${app.id}`}>Voir</Link>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/BoardView.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ApplicationTable, type ApplicationRow } from "./ApplicationTable";
import { KanbanBoard } from "./KanbanBoard";

export function BoardView({ applications }: { applications: ApplicationRow[] }) {
  const [vue, setVue] = useState<"table" | "kanban">("kanban");

  return (
    <div>
      <div>
        <button onClick={() => setVue("table")} disabled={vue === "table"}>
          Tableau
        </button>
        <button onClick={() => setVue("kanban")} disabled={vue === "kanban"}>
          Kanban
        </button>
      </div>
      {vue === "table" ? (
        <ApplicationTable applications={applications} />
      ) : (
        <KanbanBoard applications={applications} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update `src/app/page.tsx` to use `BoardView` instead of `ApplicationTable` directly**

```tsx
import { listApplications } from "@/actions/applications";
import { estARelancer, SEUIL_RELANCE_JOURS_DEFAUT } from "@/lib/reminders";
import { BoardView } from "@/components/BoardView";
import Link from "next/link";

export default async function HomePage() {
  const applications = await listApplications();
  const maintenant = new Date();

  const rows = applications.map((app) => ({
    id: app.id,
    entreprise: app.entreprise,
    poste: app.poste,
    statut: app.statut,
    dateCandidature: app.dateCandidature.toISOString().slice(0, 10),
    typeContrat: app.typeContrat,
    aRelancer: estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant),
  }));

  return (
    <main>
      <h1>Mes candidatures</h1>
      <p>
        <Link href="/applications/new">+ Nouvelle candidature</Link> ·{" "}
        <Link href="/dashboard">Tableau de bord</Link>
      </p>
      <BoardView applications={rows} />
    </main>
  );
}
```

- [ ] **Step 4: Manually verify**

On `/`, confirm the Kanban view shows six columns, that dragging a card to another column persists after `router.refresh()` (check the statut changed by switching to table view), and that toggling between Kanban/Tableau works without a full page reload.

- [ ] **Step 5: Commit**

```bash
git add src/components/KanbanBoard.tsx src/components/BoardView.tsx src/app/page.tsx
git commit -m "feat: add Kanban view with drag-and-drop statut updates and view toggle"
```

---

### Task 12: UI — Application creation form and detail page

**Files:**
- Create: `src/components/ApplicationForm.tsx`
- Create: `src/app/applications/new/page.tsx`
- Create: `src/components/ApplicationDetailTabs.tsx`
- Create: `src/app/applications/[id]/page.tsx`

**Interfaces:**
- Consumes: `createApplication`, `getApplication` (`@/actions/applications`), `addContact` (`@/actions/contacts`), `addRelance` (`@/actions/relances`), `addEntretien` (`@/actions/entretiens`), `uploadAttachment` (`@/actions/attachments`).

- [ ] **Step 1: Write `src/components/ApplicationForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createApplication } from "@/actions/applications";

export function ApplicationForm() {
  const router = useRouter();
  const [entreprise, setEntreprise] = useState("");
  const [poste, setPoste] = useState("");
  const [dateCandidature, setDateCandidature] = useState("");
  const [lienOffre, setLienOffre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    try {
      const app = await createApplication({
        entreprise,
        poste,
        dateCandidature: new Date(dateCandidature),
        lienOffre: lienOffre || undefined,
      } as any);
      router.push(`/applications/${app.id}`);
    } catch {
      setErreur("Impossible de créer la candidature. Vérifie les champs.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Entreprise</label>
        <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} required />
      </div>
      <div>
        <label>Poste</label>
        <input value={poste} onChange={(e) => setPoste(e.target.value)} required />
      </div>
      <div>
        <label>Date de candidature</label>
        <input
          type="date"
          value={dateCandidature}
          onChange={(e) => setDateCandidature(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Lien de l'offre</label>
        <input value={lienOffre} onChange={(e) => setLienOffre(e.target.value)} />
      </div>
      {erreur && <p role="alert">{erreur}</p>}
      <button type="submit">Créer</button>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/app/applications/new/page.tsx`**

```tsx
import { ApplicationForm } from "@/components/ApplicationForm";

export default function NewApplicationPage() {
  return (
    <main>
      <h1>Nouvelle candidature</h1>
      <ApplicationForm />
    </main>
  );
}
```

- [ ] **Step 3: Write `src/components/ApplicationDetailTabs.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addContact } from "@/actions/contacts";
import { addRelance } from "@/actions/relances";
import { addEntretien } from "@/actions/entretiens";
import { uploadAttachment } from "@/actions/attachments";

interface Application {
  id: string;
  notes: string | null;
  contacts: { id: string; nom: string; email: string | null; telephone: string | null }[];
  relances: { id: string; date: Date; note: string | null }[];
  entretiens: { id: string; date: Date; type: string; notes: string | null }[];
  piecesJointes: { id: string; nomFichier: string; type: string }[];
}

const ONGLETS = ["infos", "contacts", "entretiens", "relances", "fichiers"] as const;
type Onglet = (typeof ONGLETS)[number];

export function ApplicationDetailTabs({ application }: { application: Application }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>("infos");

  return (
    <div>
      <nav>
        {ONGLETS.map((o) => (
          <button key={o} onClick={() => setOnglet(o)} disabled={onglet === o}>
            {o}
          </button>
        ))}
      </nav>

      {onglet === "infos" && <p>{application.notes ?? "Aucune note."}</p>}

      {onglet === "contacts" && (
        <div>
          <ul>
            {application.contacts.map((c) => (
              <li key={c.id}>
                {c.nom} — {c.email ?? "—"} — {c.telephone ?? "—"}
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await addContact({
                applicationId: application.id,
                nom: String(form.get("nom")),
                email: String(form.get("email") || ""),
              } as any);
              router.refresh();
              e.currentTarget.reset();
            }}
          >
            <input name="nom" placeholder="Nom du contact" required />
            <input name="email" placeholder="Email" type="email" />
            <button type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "entretiens" && (
        <div>
          <ul>
            {application.entretiens.map((e) => (
              <li key={e.id}>
                {new Date(e.date).toLocaleDateString("fr-FR")} — {e.type} — {e.notes ?? ""}
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await addEntretien({
                applicationId: application.id,
                date: new Date(String(form.get("date"))),
                type: String(form.get("type")),
              } as any);
              router.refresh();
              e.currentTarget.reset();
            }}
          >
            <input name="date" type="date" required />
            <select name="type" required>
              <option value="TELEPHONE">Téléphone</option>
              <option value="VISIO">Visio</option>
              <option value="PRESENTIEL">Présentiel</option>
            </select>
            <button type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "relances" && (
        <div>
          <ul>
            {application.relances.map((r) => (
              <li key={r.id}>
                {new Date(r.date).toLocaleDateString("fr-FR")} — {r.note ?? ""}
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await addRelance({
                applicationId: application.id,
                date: new Date(String(form.get("date"))),
                note: String(form.get("note") || ""),
              } as any);
              router.refresh();
              e.currentTarget.reset();
            }}
          >
            <input name="date" type="date" required />
            <input name="note" placeholder="Note" />
            <button type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "fichiers" && (
        <div>
          <ul>
            {application.piecesJointes.map((p) => (
              <li key={p.id}>
                <a href={`/api/attachments/${p.id}`}>
                  {p.nomFichier} ({p.type})
                </a>
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const file = form.get("file") as File;
              const type = String(form.get("type"));
              await uploadAttachment(application.id, type as any, file);
              router.refresh();
              e.currentTarget.reset();
            }}
          >
            <select name="type" required>
              <option value="CV">CV</option>
              <option value="LETTRE_MOTIVATION">Lettre de motivation</option>
              <option value="AUTRE">Autre</option>
            </select>
            <input name="file" type="file" accept=".pdf,.docx" required />
            <button type="submit">Envoyer</button>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write `src/app/applications/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getApplication } from "@/actions/applications";
import { ApplicationDetailTabs } from "@/components/ApplicationDetailTabs";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const application = await getApplication(params.id);
  if (!application) notFound();

  return (
    <main>
      <h1>
        {application.entreprise} — {application.poste}
      </h1>
      <p>Statut : {application.statut}</p>
      <ApplicationDetailTabs application={application} />
    </main>
  );
}
```

- [ ] **Step 5: Manually verify**

From `/`, click "+ Nouvelle candidature", submit the form, confirm redirect to the new detail page. On the detail page, add a contact, an entretien, a relance, and upload a small PDF — confirm each appears in its tab's list, and the attachment link downloads the file.

- [ ] **Step 6: Commit**

```bash
git add src/components/ApplicationForm.tsx src/app/applications/new src/components/ApplicationDetailTabs.tsx src/app/applications/[id]
git commit -m "feat: add application creation form and detail page with sub-resource management"
```

---

### Task 13: UI — Dashboard (stats + reminder banner)

**Files:**
- Create: `src/components/DashboardStats.tsx`
- Create: `src/components/ReminderBanner.tsx`
- Create: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `listApplications` (`@/actions/applications`), `computeDashboardStats`/`DashboardStats` (`@/lib/stats`), `estARelancer`/`SEUIL_RELANCE_JOURS_DEFAUT` (`@/lib/reminders`).

- [ ] **Step 1: Write `src/components/DashboardStats.tsx`**

```tsx
import type { DashboardStats } from "@/lib/stats";

export function DashboardStatsView({ stats }: { stats: DashboardStats }) {
  const maxCount = Math.max(1, ...Object.values(stats.parStatut));

  return (
    <section>
      <h2>Statistiques</h2>
      <p>Total candidatures : {stats.total}</p>
      <p>Taux de réponse : {Math.round(stats.tauxReponse * 100)}%</p>
      <div>
        {Object.entries(stats.parStatut).map(([statut, count]) => (
          <div key={statut} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 120 }}>{statut}</span>
            <div
              style={{
                background: "#4a6cf7",
                height: 12,
                width: `${(count / maxCount) * 100}%`,
              }}
            />
            <span>{count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `src/components/ReminderBanner.tsx`**

```tsx
import Link from "next/link";

interface ARelancer {
  id: string;
  entreprise: string;
  poste: string;
}

export function ReminderBanner({ applications }: { applications: ARelancer[] }) {
  if (applications.length === 0) return null;

  return (
    <section style={{ background: "#fff3cd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
      <strong>À relancer aujourd'hui ({applications.length})</strong>
      <ul>
        {applications.map((app) => (
          <li key={app.id}>
            <Link href={`/applications/${app.id}`}>
              {app.entreprise} — {app.poste}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Write `src/app/dashboard/page.tsx`**

```tsx
import { listApplications } from "@/actions/applications";
import { computeDashboardStats } from "@/lib/stats";
import { estARelancer, SEUIL_RELANCE_JOURS_DEFAUT } from "@/lib/reminders";
import { DashboardStatsView } from "@/components/DashboardStats";
import { ReminderBanner } from "@/components/ReminderBanner";

export default async function DashboardPage() {
  const applications = await listApplications();
  const maintenant = new Date();

  const stats = computeDashboardStats(applications);
  const aRelancer = applications
    .filter((app) => estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant))
    .map((app) => ({ id: app.id, entreprise: app.entreprise, poste: app.poste }));

  return (
    <main>
      <h1>Tableau de bord</h1>
      <ReminderBanner applications={aRelancer} />
      <DashboardStatsView stats={stats} />
    </main>
  );
}
```

- [ ] **Step 4: Manually verify**

Visit `/dashboard`. Confirm the stats section shows correct counts matching the applications created in Task 12's manual test, and that any application without a relance for 10+ days appears in the reminder banner.

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardStats.tsx src/components/ReminderBanner.tsx src/app/dashboard
git commit -m "feat: add dashboard with stats and follow-up reminder banner"
```

---

### Task 14: End-to-end wiring and smoke test

**Files:**
- Modify: `src/app/layout.tsx` (add nav bar)
- No new source files — this task is a full-stack verification pass.

**Interfaces:**
- Consumes: all components and actions from Tasks 1–13.

- [ ] **Step 1: Add a simple nav bar to `src/app/layout.tsx`**

```tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Suivi candidatures",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header style={{ padding: 12, background: "#1a1a2e", color: "white" }}>
          <Link href="/" style={{ color: "white", marginRight: 16 }}>
            Candidatures
          </Link>
          <Link href="/dashboard" style={{ color: "white" }}>
            Tableau de bord
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Run the full automated test suite**

```bash
docker compose exec app npm run test
```

Expected: all unit and integration tests pass (Tasks 2–9).

- [ ] **Step 3: Run the full manual smoke test from a clean stack**

```bash
docker compose down -v
docker compose up --build -d
docker compose exec app npm run prisma:migrate:deploy
docker compose exec app npm run prisma:seed
```

Then in a browser:
1. Visit `http://localhost:3000/` — confirm redirect to `/login`.
2. Log in with the seeded `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
3. Create a new application via "+ Nouvelle candidature".
4. On its detail page, add a contact, an entretien, a relance dated 11+ days ago, and upload a PDF attachment; confirm the download link works.
5. Go to `/` and confirm the application appears in both Kanban and Tableau views, with a "⚠️ à relancer" badge.
6. Drag the Kanban card to a different column and confirm the statut persists after refresh.
7. Go to `/dashboard` and confirm the application appears in the reminder banner and the stats counts are correct.
8. Log out (clear cookies or use an incognito window) and confirm `/dashboard` redirects to `/login`.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add navigation bar and complete end-to-end wiring"
```

---

## Self-Review Notes

- **Spec coverage:** every spec section maps to a task — architecture/Docker (Task 1), data model (Task 2), validations (Task 3), rappels (Task 4, 13), stats (Task 5, 13), auth (Task 6), CRUD candidature (Task 7), contacts/entretiens/relances (Task 8), pièces jointes (Task 9), vues Kanban/Tableau (Task 10, 11), formulaire/fiche détail (Task 12), erreurs (validation in Task 3/7/9, generic auth error in Task 6), tests (unit: Tasks 3–5; integration: Tasks 2, 6–9; manual for UI: Tasks 10–14).
- **Type consistency checked:** `ApplicationRow` (Task 10) is reused unchanged by `KanbanBoard` (Task 11); `updateApplicationStatut(id, statut)` signature from Task 7 matches its call site in Task 11; `uploadAttachment(applicationId, type, file)` signature from Task 9 matches its call site in Task 12; `DashboardStats`/`computeDashboardStats` from Task 5 matches usage in Task 13.
- **No placeholders:** every step has runnable code or a concrete manual verification checklist; no "TBD"/"similar to Task N" shortcuts.
