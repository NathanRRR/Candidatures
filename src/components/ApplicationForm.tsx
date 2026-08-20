"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createApplication } from "@/actions/applications";

export function ApplicationForm() {
  const router = useRouter();
  const [entreprise, setEntreprise] = useState("");
  const [poste, setPoste] = useState("");
  const [dateCandidature, setDateCandidature] = useState("");
  const [lienOffre, setLienOffre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    try {
      const app = await createApplication({
        entreprise,
        poste,
        dateCandidature: new Date(dateCandidature),
        lienOffre: lienOffre || undefined,
      } as any);
      router.push(`/applications/${app.id}`);
    } catch {
      setErreur("Impossible de créer la candidature. Vérifie les champs.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Entreprise</label>
        <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} required />
      </div>
      <div>
        <label>Poste</label>
        <input value={poste} onChange={(e) => setPoste(e.target.value)} required />
      </div>
      <div>
        <label>Date de candidature</label>
        <input
          type="date"
          value={dateCandidature}
          onChange={(e) => setDateCandidature(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Lien de l'offre</label>
        <input value={lienOffre} onChange={(e) => setLienOffre(e.target.value)} />
      </div>
      {erreur && <p role="alert">{erreur}</p>}
      <button type="submit">Créer</button>
    </form>
  );
}
