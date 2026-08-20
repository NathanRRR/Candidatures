"use server";

import { prisma } from "@/lib/prisma";
import { entretienInputSchema, type EntretienInput } from "@/lib/validations";

export async function addEntretien(input: EntretienInput) {
  const data = entretienInputSchema.parse(input);
  return prisma.entretien.create({ data });
}
