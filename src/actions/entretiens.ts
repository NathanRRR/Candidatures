"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { entretienInputSchema, type EntretienInput } from "@/lib/validations";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Entretien } from "@prisma/client";

export async function addEntretien(input: EntretienInput): Promise<ActionResult<Entretien>> {
  return runAction(async () => {
    await requireSession();
    const data = entretienInputSchema.parse(input);
    const entretien = await prisma.entretien.create({ data });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return entretien;
  });
}
