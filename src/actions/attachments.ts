"use server";

import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export class AttachmentValidationError extends Error {}

export async function uploadAttachment(
  applicationId: string,
  type: "CV" | "LETTRE_MOTIVATION" | "AUTRE",
  file: File
) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new AttachmentValidationError("Le fichier dépasse la taille maximale de 10 Mo");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new AttachmentValidationError("Seuls les fichiers PDF et DOCX sont acceptés");
  }

  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) {
    throw new AttachmentValidationError("Candidature introuvable");
  }

  const uploadRoot = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
  const dir = path.join(uploadRoot, applicationId);
  await mkdir(dir, { recursive: true });

  const fileName = `${randomUUID()}${path.extname(file.name)}`;
  const filePath = path.join(dir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return prisma.pieceJointe.create({
    data: {
      applicationId,
      nomFichier: file.name,
      type,
      cheminFichier: path.join(applicationId, fileName),
    },
  });
}
