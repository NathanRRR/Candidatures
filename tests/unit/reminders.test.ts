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
