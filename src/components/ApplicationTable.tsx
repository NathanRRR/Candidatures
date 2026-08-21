"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface ApplicationRow {
  id: string;
  entreprise: string;
  poste: string;
  statut: string;
  dateCandidature: string | null;
  typeContrat: string | null;
  aRelancer: boolean;
}

const STATUTS = ["A_POSTULER", "POSTULE", "ENTRETIEN", "OFFRE", "REFUSE", "ABANDONNE"];

export function ApplicationTable({ applications }: { applications: ApplicationRow[] }) {
  const [filtreStatut, setFiltreStatut] = useState<string>("TOUS");
  const [recherche, setRecherche] = useState("");

  const filtrees = useMemo(() => {
    return applications.filter((app) => {
      const matchStatut = filtreStatut === "TOUS" || app.statut === filtreStatut;
      const matchRecherche = app.entreprise.toLowerCase().includes(recherche.toLowerCase());
      return matchStatut && matchRecherche;
    });
  }, [applications, filtreStatut, recherche]);

  return (
    <div>
      <div className="filters">
        <input
          placeholder="Rechercher une entreprise..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
          <option value="TOUS">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Poste</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Contrat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrees.map((app) => (
              <tr key={app.id}>
                <td>{app.entreprise}</td>
                <td>{app.poste}</td>
                <td>
                  <span className={`badge badge-${app.statut}`}>{app.statut}</span>
                </td>
                <td>{app.dateCandidature ?? "—"}</td>
                <td>{app.typeContrat ?? "—"}</td>
                <td>
                  {app.aRelancer && (
                    <span className="relance-flag" title="À relancer">
                      ⚠️
                    </span>
                  )}
                  <Link href={`/applications/${app.id}`}>Voir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
