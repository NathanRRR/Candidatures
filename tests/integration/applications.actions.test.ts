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

async function createApp(input: any) {
  const result = await createApplication(input);
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

describe("applications server actions", () => {
  it("creates an application with default statut A_POSTULER", async () => {
    const app = await createApp({
      entreprise: "Acme",
      poste: "Développeur",
      dateCandidature: new Date("2026-08-01"),
    });
    expect(app.statut).toBe("A_POSTULER");
    expect(app.entreprise).toBe("Acme");
  });

  it("updates the statut", async () => {
    const app = await createApp({
      entreprise: "Acme",
      poste: "Développeur",
      dateCandidature: new Date("2026-08-01"),
    });
    const updated = await updateApplicationStatut(app.id, "ENTRETIEN");
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.statut).toBe("ENTRETIEN");
    }
  });

  it("lists all applications", async () => {
    await createApp({ entreprise: "A", poste: "X", dateCandidature: new Date() });
    await createApp({ entreprise: "B", poste: "Y", dateCandidature: new Date() });
    const apps = await listApplications();
    expect(apps).toHaveLength(2);
  });

  it("gets an application with its relations", async () => {
    const app = await createApp({ entreprise: "A", poste: "X", dateCandidature: new Date() });
    const found = await getApplication(app.id);
    expect(found?.contacts).toEqual([]);
    expect(found?.relances).toEqual([]);
  });

  it("deletes an application", async () => {
    const app = await createApp({ entreprise: "A", poste: "X", dateCandidature: new Date() });
    const result = await deleteApplication(app.id);
    expect(result.ok).toBe(true);
    expect(await getApplication(app.id)).toBeNull();
  });
});
