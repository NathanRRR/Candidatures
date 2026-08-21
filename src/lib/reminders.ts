export const SEUIL_RELANCE_JOURS_DEFAUT = 10;

const STATUTS_ACTIFS = new Set(["POSTULE", "ENTRETIEN", "OFFRE"]);

export interface ApplicationForReminder {
  statut: string;
  dateCandidature: Date | null;
  relances: { date: Date }[];
}

export function estARelancer(
  app: ApplicationForReminder,
  seuilJours: number,
  maintenant: Date
): boolean {
  if (!STATUTS_ACTIFS.has(app.statut)) return false;

  const dernierContact = app.relances.reduce<Date | null>(
    (latest, r) => (!latest || r.date > latest ? r.date : latest),
    app.dateCandidature
  );

  if (!dernierContact) return false;

  const joursDepuis = (maintenant.getTime() - dernierContact.getTime()) / (1000 * 60 * 60 * 24);
  return joursDepuis >= seuilJours;
}
