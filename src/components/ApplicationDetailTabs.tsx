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

  return (
    <div>
      <nav>
        {ONGLETS.map((o) => (
          <button key={o} onClick={() => setOnglet(o)} disabled={onglet === o}>
            {o}
          </button>
        ))}
      </nav>

      {onglet === "infos" && <p>{application.notes ?? "Aucune note."}</p>}

      {onglet === "contacts" && (
        <div>
          <ul>
            {application.contacts.map((c) => (
              <li key={c.id}>
                {c.nom} — {c.email ?? "—"} — {c.telephone ?? "—"}
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formEl = e.currentTarget;
              const form = new FormData(formEl);
              await addContact({
                applicationId: application.id,
                nom: String(form.get("nom")),
                email: String(form.get("email") || ""),
              } as any);
              router.refresh();
              formEl.reset();
            }}
          >
            <input name="nom" placeholder="Nom du contact" required />
            <input name="email" placeholder="Email" type="email" />
            <button type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "entretiens" && (
        <div>
          <ul>
            {application.entretiens.map((e) => (
              <li key={e.id}>
                {new Date(e.date).toLocaleDateString("fr-FR")} — {e.type} — {e.notes ?? ""}
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formEl = e.currentTarget;
              const form = new FormData(formEl);
              await addEntretien({
                applicationId: application.id,
                date: new Date(String(form.get("date"))),
                type: String(form.get("type")),
              } as any);
              router.refresh();
              formEl.reset();
            }}
          >
            <input name="date" type="date" required />
            <select name="type" required>
              <option value="TELEPHONE">Téléphone</option>
              <option value="VISIO">Visio</option>
              <option value="PRESENTIEL">Présentiel</option>
            </select>
            <button type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "relances" && (
        <div>
          <ul>
            {application.relances.map((r) => (
              <li key={r.id}>
                {new Date(r.date).toLocaleDateString("fr-FR")} — {r.note ?? ""}
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formEl = e.currentTarget;
              const form = new FormData(formEl);
              await addRelance({
                applicationId: application.id,
                date: new Date(String(form.get("date"))),
                note: String(form.get("note") || ""),
              } as any);
              router.refresh();
              formEl.reset();
            }}
          >
            <input name="date" type="date" required />
            <input name="note" placeholder="Note" />
            <button type="submit">Ajouter</button>
          </form>
        </div>
      )}

      {onglet === "fichiers" && (
        <div>
          <ul>
            {application.piecesJointes.map((p) => (
              <li key={p.id}>
                <a href={`/api/attachments/${p.id}`}>
                  {p.nomFichier} ({p.type})
                </a>
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formEl = e.currentTarget;
              const formData = new FormData(formEl);
              await uploadAttachmentFromForm(application.id, formData);
              router.refresh();
              formEl.reset();
            }}
          >
            <select name="type" required>
              <option value="CV">CV</option>
              <option value="LETTRE_MOTIVATION">Lettre de motivation</option>
              <option value="AUTRE">Autre</option>
            </select>
            <input name="file" type="file" accept=".pdf,.docx" required />
            <button type="submit">Envoyer</button>
          </form>
        </div>
      )}
    </div>
  );
}
