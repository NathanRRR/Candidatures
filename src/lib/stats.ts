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
