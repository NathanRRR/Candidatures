"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createApplication } from "@/actions/applications";

export function ApplicationForm() {
  const router = useRouter();
  const [entreprise, setEntreprise] = useState("");
  const [poste, setPoste] = useState("");
  const [dateCandidature, setDateCandidature] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [lienOffre, setLienOffre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    try {
      const result = await createApplication({
        entreprise,
        poste,
        dateCandidature: dateCandidature ? new Date(dateCandidature) : undefined,
        dateLimite: dateLimite ? new Date(dateLimite) : undefined,
        lienOffre: lienOffre || undefined,
      } as any);
      if (!result.ok) {
        setErreur(result.message);
        return;
      }
      router.push(`/applications/${result.data.id}`);
    } catch {
      setErreur("Impossible de créer la candidature. Une erreur inattendue est survenue.");
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <div className="form-field">
        <label>Entreprise</label>
        <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} required />
      </div>
      <div className="form-field">
        <label>Poste</label>
        <input value={poste} onChange={(e) => setPoste(e.target.value)} required />
      </div>
      <div className="form-field">
        <label>Date de candidature (optionnel — à remplir une fois postulé)</label>
        <input
          type="date"
          value={dateCandidature}
          onChange={(e) => setDateCandidature(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label>Date limite de candidature (optionnel)</label>
        <input
          type="date"
          value={dateLimite}
          onChange={(e) => setDateLimite(e.target.value)}
        />
      </div>
      <div className="form-field">
        <label>Lien de l'offre</label>
        <input value={lienOffre} onChange={(e) => setLienOffre(e.target.value)} />
      </div>
      {erreur && <p className="alert" role="alert">{erreur}</p>}
      <button className="btn" type="submit">Créer</button>
    </form>
  );
}
