"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { contactInputSchema, type ContactInput } from "@/lib/validations";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Contact } from "@prisma/client";

export async function addContact(input: ContactInput): Promise<ActionResult<Contact>> {
  return runAction(async () => {
    await requireSession();
    const data = contactInputSchema.parse(input);
    const contact = await prisma.contact.create({ data });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return contact;
  });
}
