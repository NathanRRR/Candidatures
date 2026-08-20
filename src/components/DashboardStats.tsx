import type { DashboardStats } from "@/lib/stats";

export function DashboardStatsView({ stats }: { stats: DashboardStats }) {
  const maxCount = Math.max(1, ...Object.values(stats.parStatut));

  return (
    <section>
      <h2>Statistiques</h2>
      <p>Total candidatures : {stats.total}</p>
      <p>Taux de réponse : {Math.round(stats.tauxReponse * 100)}%</p>
      <div>
        {Object.entries(stats.parStatut).map(([statut, count]) => (
          <div key={statut} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 120 }}>{statut}</span>
            <div
              style={{
                background: "#4a6cf7",
                height: 12,
                width: `${(count / maxCount) * 100}%`,
              }}
            />
            <span>{count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
