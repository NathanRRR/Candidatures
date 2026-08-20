"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { applicationInputSchema, type ApplicationInput } from "@/lib/validations";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Application, Statut } from "@prisma/client";

export async function createApplication(input: ApplicationInput): Promise<ActionResult<Application>> {
  return runAction(async () => {
    await requireSession();
    const data = applicationInputSchema.parse(input);
    const application = await prisma.application.create({ data });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return application;
  });
}

export async function updateApplicationStatut(
  id: string,
  statut: Statut
): Promise<ActionResult<Application>> {
  return runAction(async () => {
    await requireSession();
    const application = await prisma.application.update({ where: { id }, data: { statut } });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return application;
  });
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

export async function deleteApplication(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requireSession();
    await prisma.application.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return null;
  });
}
