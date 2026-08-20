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
