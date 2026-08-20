"use server";

import { prisma } from "@/lib/prisma";
import { contactInputSchema, type ContactInput } from "@/lib/validations";

export async function addContact(input: ContactInput) {
  const data = contactInputSchema.parse(input);
  return prisma.contact.create({ data });
}
