import { listApplications } from "@/actions/applications";
import { estARelancer, SEUIL_RELANCE_JOURS_DEFAUT } from "@/lib/reminders";
import { ApplicationTable } from "@/components/ApplicationTable";
import Link from "next/link";

export default async function HomePage() {
  const applications = await listApplications();
  const maintenant = new Date();

  const rows = applications.map((app) => ({
    id: app.id,
    entreprise: app.entreprise,
    poste: app.poste,
    statut: app.statut,
    dateCandidature: app.dateCandidature.toISOString().slice(0, 10),
    typeContrat: app.typeContrat,
    aRelancer: estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant),
  }));

  return (
    <main>
      <h1>Mes candidatures</h1>
      <p>
        <Link href="/applications/new">+ Nouvelle candidature</Link> ·{" "}
        <Link href="/dashboard">Tableau de bord</Link>
      </p>
      <ApplicationTable applications={rows} />
    </main>
  );
}
