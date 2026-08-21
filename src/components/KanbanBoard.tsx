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
      const result = await updateApplicationStatut(id, statut as any);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="kanban">
      {COLONNES.map((col) => (
        <div
          key={col.statut}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.statut)}
          className="kanban-column"
        >
          <h3>{col.label}</h3>
          {applications
            .filter((app) => app.statut === col.statut)
            .map((app) => (
              <div key={app.id} draggable onDragStart={() => setDragId(app.id)} className="kanban-card">
                <strong>{app.entreprise}</strong>
                <div className="poste">{app.poste}</div>
                {app.aRelancer && (
                  <span className="relance-flag" title="À relancer">
                    ⚠️
                  </span>
                )}
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
