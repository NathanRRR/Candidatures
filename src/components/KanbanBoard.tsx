"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateApplicationStatut } from "@/actions/applications";
import type { ApplicationRow } from "./ApplicationTable";

const COLONNES: { statut: string; label: string }[] = [
  { statut: "A_POSTULER", label: "À postuler" },
  { statut: "POSTULE", label: "Postulé" },
  { statut: "ENTRETIEN", label: "Entretien" },
  { statut: "OFFRE", label: "Offre" },
  { statut: "REFUSE", label: "Refusé" },
  { statut: "ABANDONNE", label: "Abandonné" },
];

export function KanbanBoard({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDrop(statut: string) {
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    startTransition(async () => {
      await updateApplicationStatut(id, statut as any);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {COLONNES.map((col) => (
        <div
          key={col.statut}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.statut)}
          style={{ flex: 1, background: "#fff", padding: 8, borderRadius: 8, minHeight: 200 }}
        >
          <h3>{col.label}</h3>
          {applications
            .filter((app) => app.statut === col.statut)
            .map((app) => (
              <div
                key={app.id}
                draggable
                onDragStart={() => setDragId(app.id)}
                style={{ background: "#f0f0f2", padding: 8, marginBottom: 8, borderRadius: 6 }}
              >
                <strong>{app.entreprise}</strong>
                <div>{app.poste}</div>
                {app.aRelancer && <span title="À relancer">⚠️</span>}
                <div>
                  <Link href={`/applications/${app.id}`}>Voir</Link>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
