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
