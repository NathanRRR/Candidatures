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
