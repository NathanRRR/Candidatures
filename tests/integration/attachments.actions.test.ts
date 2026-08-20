import { describe, it, expect, beforeEach, afterAll } from "vitest";
import os from "node:os";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { createApplication } from "@/actions/applications";
import { uploadAttachment } from "@/actions/attachments";
import { AttachmentValidationError } from "@/lib/errors";

beforeEach(async () => {
  await prisma.application.deleteMany();
  process.env.UPLOAD_DIR = path.join(os.tmpdir(), "candidatures-uploads-test");
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function makeApplication() {
  return createApplication({ entreprise: "Acme", poste: "Développeur", dateCandidature: new Date() } as any);
}

describe("uploadAttachment", () => {
  it("stores a valid PDF and creates a PieceJointe row", async () => {
    const app = await makeApplication();
    const file = new File([new Uint8Array([1, 2, 3])], "cv.pdf", { type: "application/pdf" });
    const piece = await uploadAttachment(app.id, "CV", file);
    expect(piece.nomFichier).toBe("cv.pdf");
    expect(piece.type).toBe("CV");
  });

  it("rejects a file that is too large", async () => {
    const app = await makeApplication();
    const bigContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([bigContent], "cv.pdf", { type: "application/pdf" });
    await expect(uploadAttachment(app.id, "CV", file)).rejects.toThrow(AttachmentValidationError);
  });

  it("rejects a disallowed file type", async () => {
    const app = await makeApplication();
    const file = new File([new Uint8Array([1])], "cv.exe", { type: "application/x-msdownload" });
    await expect(uploadAttachment(app.id, "CV", file)).rejects.toThrow(AttachmentValidationError);
  });

  it("rejects an applicationId that does not correspond to a real application", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "cv.pdf", { type: "application/pdf" });
    await expect(uploadAttachment("../../../../tmp/evil", "CV", file)).rejects.toThrow(
      AttachmentValidationError
    );
  });
});
