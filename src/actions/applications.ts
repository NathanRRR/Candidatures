"use server";

import { prisma } from "@/lib/prisma";
import { applicationInputSchema, type ApplicationInput } from "@/lib/validations";
import type { Statut } from "@prisma/client";

export async function createApplication(input: ApplicationInput) {
  const data = applicationInputSchema.parse(input);
  return prisma.application.create({ data });
}

export async function updateApplicationStatut(id: string, statut: Statut) {
  return prisma.application.update({ where: { id }, data: { statut } });
}

export async function listApplications() {
  return prisma.application.findMany({
    include: { relances: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplication(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: { contacts: true, relances: true, entretiens: true, piecesJointes: true },
  });
}

export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } });
}
