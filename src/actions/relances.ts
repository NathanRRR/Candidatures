"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { relanceInputSchema, type RelanceInput } from "@/lib/validations";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Relance } from "@prisma/client";

export async function addRelance(input: RelanceInput): Promise<ActionResult<Relance>> {
  return runAction(async () => {
    await requireSession();
    const data = relanceInputSchema.parse(input);
    return prisma.relance.create({ data });
  });
}
