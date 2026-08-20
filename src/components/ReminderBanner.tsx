import Link from "next/link";

interface ARelancer {
  id: string;
  entreprise: string;
  poste: string;
}

export function ReminderBanner({ applications }: { applications: ARelancer[] }) {
  if (applications.length === 0) return null;

  return (
    <section style={{ background: "#fff3cd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
      <strong>À relancer aujourd'hui ({applications.length})</strong>
      <ul>
        {applications.map((app) => (
          <li key={app.id}>
            <Link href={`/applications/${app.id}`}>
              {app.entreprise} — {app.poste}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
