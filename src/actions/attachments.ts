"use server";

import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AttachmentValidationError } from "@/lib/errors";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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

// Adapter for browser calls: React's Server Action client (processReply) only
// knows how to serialize a handful of built-ins (FormData, Map, Set, Array) —
// it has no case for a bare File/Blob argument, so calling
// uploadAttachment(applicationId, type, file) directly from a "use client"
// component throws "Only plain objects, and a few built-ins, can be passed to
// Server Actions" before any request is even sent. Wrapping the file in an
// actual FormData (which IS handled) and unpacking it here avoids that, while
// leaving uploadAttachment's own signature untouched.
export async function uploadAttachmentFromForm(applicationId: string, formData: FormData) {
  const file = formData.get("file") as File;
  const type = formData.get("type") as "CV" | "LETTRE_MOTIVATION" | "AUTRE";
  return uploadAttachment(applicationId, type, file);
}
