"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteApplication } from "@/actions/applications";

export function DeleteApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleDelete() {
    const confirme = window.confirm(
      "Supprimer définitivement cette candidature et tout son historique (contacts, entretiens, relances, fichiers) ? Cette action est irréversible."
    );
    if (!confirme) return;

    setErreur(null);
    setEnCours(true);
    try {
      const result = await deleteApplication(applicationId);
      if (!result.ok) {
        setErreur(result.message);
        setEnCours(false);
        return;
      }
      router.push("/");
    } catch {
      setErreur("Une erreur inattendue est survenue.");
      setEnCours(false);
    }
  }

  return (
    <div>
      <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={enCours}>
        {enCours ? "Suppression..." : "Supprimer"}
      </button>
      {erreur && (
        <p className="alert" role="alert" style={{ marginTop: 10 }}>
          {erreur}
        </p>
      )}
    </div>
  );
}
