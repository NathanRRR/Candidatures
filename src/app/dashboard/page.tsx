import { listApplications } from "@/actions/applications";
import { computeDashboardStats } from "@/lib/stats";
import { estARelancer, SEUIL_RELANCE_JOURS_DEFAUT } from "@/lib/reminders";
import { DashboardStatsView } from "@/components/DashboardStats";
import { ReminderBanner } from "@/components/ReminderBanner";

export default async function DashboardPage() {
  const applications = await listApplications();
  const maintenant = new Date();

  const stats = computeDashboardStats(applications);
  const aRelancer = applications
    .filter((app) => estARelancer(app, SEUIL_RELANCE_JOURS_DEFAUT, maintenant))
    .map((app) => ({ id: app.id, entreprise: app.entreprise, poste: app.poste }));

  return (
    <main className="page">
      <h1>Tableau de bord</h1>
      <ReminderBanner applications={aRelancer} />
      <DashboardStatsView stats={stats} />
    </main>
  );
}
