"use server";

import { prisma } from "@/lib/prisma";
import { relanceInputSchema, type RelanceInput } from "@/lib/validations";

export async function addRelance(input: RelanceInput) {
  const data = relanceInputSchema.parse(input);
  return prisma.relance.create({ data });
}
