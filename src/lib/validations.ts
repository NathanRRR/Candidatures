import { z } from "zod";

export const applicationInputSchema = z.object({
  entreprise: z.string().min(1, "L'entreprise est requise"),
  poste: z.string().min(1, "Le poste est requis"),
  statut: z
    .enum(["A_POSTULER", "POSTULE", "ENTRETIEN", "OFFRE", "REFUSE", "ABANDONNE"])
    .default("A_POSTULER"),
  dateCandidature: z.coerce.date(),
  lienOffre: z.string().url().optional().or(z.literal("")),
  salaireMin: z.coerce.number().int().nonnegative().optional(),
  salaireMax: z.coerce.number().int().nonnegative().optional(),
  teletravail: z.enum(["OUI", "NON", "HYBRIDE"]).optional(),
  localisation: z.string().optional(),
  typeContrat: z.enum(["CDI", "CDD", "FREELANCE", "STAGE", "ALTERNANCE"]).optional(),
  notes: z.string().optional(),
});
export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export const contactInputSchema = z.object({
  applicationId: z.string().uuid(),
  nom: z.string().min(1, "Le nom est requis"),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  role: z.string().optional(),
});
export type ContactInput = z.infer<typeof contactInputSchema>;

export const relanceInputSchema = z.object({
  applicationId: z.string().uuid(),
  date: z.coerce.date(),
  note: z.string().optional(),
});
export type RelanceInput = z.infer<typeof relanceInputSchema>;

export const entretienInputSchema = z.object({
  applicationId: z.string().uuid(),
  date: z.coerce.date(),
  type: z.enum(["TELEPHONE", "VISIO", "PRESENTIEL"]),
  notes: z.string().optional(),
  prochaineEtape: z.string().optional(),
});
export type EntretienInput = z.infer<typeof entretienInputSchema>;
