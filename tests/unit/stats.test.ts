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
