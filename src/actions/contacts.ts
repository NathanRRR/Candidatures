"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { contactInputSchema, type ContactInput } from "@/lib/validations";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Contact } from "@prisma/client";

export async function addContact(input: ContactInput): Promise<ActionResult<Contact>> {
  return runAction(async () => {
    await requireSession();
    const data = contactInputSchema.parse(input);
    return prisma.contact.create({ data });
  });
}
