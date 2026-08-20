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
