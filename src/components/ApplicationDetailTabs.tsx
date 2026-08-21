"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addContact } from "@/actions/contacts";
import { addRelance } from "@/actions/relances";
import { addEntretien } from "@/actions/entretiens";
import { uploadAttachmentFromForm } from "@/actions/attachments";

interface Application {
  id: string;
  notes: string | null;
  contacts: { id: string; nom: string; email: string | null; telephone: string | null }[];
  relances: { id: string; date: Date; note: string | null }[];
  entretiens: { id: string; date: Date; type: string; notes: string | null }[];
  piecesJointes: { id: string; nomFichier: string; type: string }[];
}

const ONGLETS = ["infos", "contacts", "entretiens", "relances", "fichiers"] as const;
type Onglet = (typeof ONGLETS)[number];

export function ApplicationDetailTabs({ application }: { application: Application }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>("infos");
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div className="card">
      <nav className="tabs">
        {ONGLETS.map((o) => (
          <button
            key={o}
            onClick={() => {
              setErreur(null);
              setOnglet(o);
            }}
            disabled={onglet === o}
          >
            {o}
          </button>
        ))}
      </nav>
      {erreur && <p className="alert" role="alert">{erreur}</p>}

      {onglet === "infos" && <p className="empty-hint">{application.notes ?? "Aucune note."}</p>}

      {onglet === "contacts" && (
        <div>
          <ul className="item-list">
            {application.contacts.map((c) => (
              <li key={c.id}>
                {c.nom} — {c.email ?? "—"} — {c.telephone ?? "—"}
              </li>
            ))}
          </ul>
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setErreur(null);
              const formEl = e.currentTarget;
              const form = new FormData(formEl);
              try {
                const result = await addContact({
                  applicationId: application.id,
                  nom: String(form.get("nom")),
                  email: String(form.get("email") || ""),
                } as any);
                if (!result.ok) {
                  setErreur(result.message);
                  return;
                }
                router.refresh();
                formEl.reset();
              } catch {
                setErreur("Une erreur inattendue est survenue.");
              }
            }}
          >
            <input name="nom" placeholder="Nom du contact" required />
            <input name="email" placeholder="Email" type="email" />
            <button className="btn btn-sm" type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "entretiens" && (
        <div>
          <ul className="item-list">
            {application.entretiens.map((e) => (
              <li key={e.id}>
                {new Date(e.date).toLocaleDateString("fr-FR")} — {e.type} — {e.notes ?? ""}
              </li>
            ))}
          </ul>
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setErreur(null);
              const formEl = e.currentTarget;
              const form = new FormData(formEl);
              try {
                const result = await addEntretien({
                  applicationId: application.id,
                  date: new Date(String(form.get("date"))),
                  type: String(form.get("type")),
                } as any);
                if (!result.ok) {
                  setErreur(result.message);
                  return;
                }
                router.refresh();
                formEl.reset();
              } catch {
                setErreur("Une erreur inattendue est survenue.");
              }
            }}
          >
            <input name="date" type="date" required />
            <select name="type" required>
              <option value="TELEPHONE">Téléphone</option>
              <option value="VISIO">Visio</option>
              <option value="PRESENTIEL">Présentiel</option>
            </select>
            <button className="btn btn-sm" type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "relances" && (
        <div>
          <ul className="item-list">
            {application.relances.map((r) => (
              <li key={r.id}>
                {new Date(r.date).toLocaleDateString("fr-FR")} — {r.note ?? ""}
              </li>
            ))}
          </ul>
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setErreur(null);
              const formEl = e.currentTarget;
              const form = new FormData(formEl);
              try {
                const result = await addRelance({
                  applicationId: application.id,
                  date: new Date(String(form.get("date"))),
                  note: String(form.get("note") || ""),
                } as any);
                if (!result.ok) {
                  setErreur(result.message);
                  return;
                }
                router.refresh();
                formEl.reset();
              } catch {
                setErreur("Une erreur inattendue est survenue.");
              }
            }}
          >
            <input name="date" type="date" required />
            <input name="note" placeholder="Note" />
            <button className="btn btn-sm" type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "fichiers" && (
        <div>
          <ul className="item-list">
            {application.piecesJointes.map((p) => (
              <li key={p.id}>
                <a href={`/api/attachments/${p.id}`}>
                  {p.nomFichier} ({p.type})
                </a>
              </li>
            ))}
          </ul>
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setErreur(null);
              const formEl = e.currentTarget;
              const formData = new FormData(formEl);
              try {
                const result = await uploadAttachmentFromForm(application.id, formData);
                if (!result.ok) {
                  setErreur(result.message);
                  return;
                }
                router.refresh();
                formEl.reset();
              } catch {
                setErreur("Une erreur inattendue est survenue.");
              }
            }}
          >
            <select name="type" required>
              <option value="CV">CV</option>
              <option value="LETTRE_MOTIVATION">Lettre de motivation</option>
              <option value="AUTRE">Autre</option>
            </select>
            <input name="file" type="file" accept=".pdf,.docx" required />
            <button className="btn btn-sm" type="submit">Envoyer</button>
          </form>
        </div>
      )}
    </div>
  );
}
