import { ZodError } from "zod";
import { AttachmentValidationError, SessionRequiredError } from "./errors";

// Discriminated result type returned by mutating Server Actions. Expected,
// validation-style failures (Zod rejection, AttachmentValidationError, a
// missing session) are reported as { ok: false, message } instead of being
// thrown, so the UI can surface them instead of silently no-oping.
// Genuinely unexpected errors (DB down, etc.) still propagate as thrown
// exceptions.
export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, message: error.errors[0]?.message ?? "Données invalides." };
    }
    if (error instanceof AttachmentValidationError || error instanceof SessionRequiredError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}
