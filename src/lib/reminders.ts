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
