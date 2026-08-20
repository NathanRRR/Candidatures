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
  const result = await createApplication({
    entreprise: "Acme",
    poste: "Développeur",
    dateCandidature: new Date(),
  } as any);
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

describe("addContact", () => {
  it("attaches a contact to an application", async () => {
    const app = await makeApplication();
    const result = await addContact({ applicationId: app.id, nom: "Jane Doe", email: "jane@acme.com" } as any);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.applicationId).toBe(app.id);
      expect(result.data.nom).toBe("Jane Doe");
    }
  });
});

describe("addRelance", () => {
  it("attaches a relance to an application", async () => {
    const app = await makeApplication();
    const result = await addRelance({ applicationId: app.id, date: new Date("2026-08-10") } as any);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.applicationId).toBe(app.id);
    }
  });
});

describe("addEntretien", () => {
  it("attaches an entretien to an application", async () => {
    const app = await makeApplication();
    const result = await addEntretien({
      applicationId: app.id,
      date: new Date("2026-08-15"),
      type: "VISIO",
    } as any);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.applicationId).toBe(app.id);
      expect(result.data.type).toBe("VISIO");
    }
  });
});
