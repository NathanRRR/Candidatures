import type { DashboardStats } from "@/lib/stats";

export function DashboardStatsView({ stats }: { stats: DashboardStats }) {
  const maxCount = Math.max(1, ...Object.values(stats.parStatut));

  return (
    <section className="card">
      <h2>Statistiques</h2>
      <p className="stats-total">Total candidatures : {stats.total}</p>
      <p className="stats-total">Taux de réponse : {Math.round(stats.tauxReponse * 100)}%</p>
      <div>
        {Object.entries(stats.parStatut).map(([statut, count]) => (
          <div key={statut} className="stat-row">
            <span className="stat-label">{statut}</span>
            <div className="stat-bar-track">
              <div
                className="stat-bar-fill"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="stat-count">{count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
