import { describe, it, expect, beforeEach, afterAll } from "vitest";
import os from "node:os";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { createApplication } from "@/actions/applications";
import { uploadAttachment } from "@/actions/attachments";

beforeEach(async () => {
  await prisma.application.deleteMany();
  process.env.UPLOAD_DIR = path.join(os.tmpdir(), "candidatures-uploads-test");
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function makeApplication() {
  const result = await createApplication({
    entreprise: "Acme",
    poste: "Développeur",
    dateCandidature: new Date(),
  } as any);
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

describe("uploadAttachment", () => {
  it("stores a valid PDF and creates a PieceJointe row", async () => {
    const app = await makeApplication();
    const file = new File([new Uint8Array([1, 2, 3])], "cv.pdf", { type: "application/pdf" });
    const result = await uploadAttachment(app.id, "CV", file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.nomFichier).toBe("cv.pdf");
      expect(result.data.type).toBe("CV");
    }
  });

  it("rejects a file that is too large", async () => {
    const app = await makeApplication();
    const bigContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([bigContent], "cv.pdf", { type: "application/pdf" });
    const result = await uploadAttachment(app.id, "CV", file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/taille maximale/);
    }
  });

  it("rejects a disallowed file type", async () => {
    const app = await makeApplication();
    const file = new File([new Uint8Array([1])], "cv.exe", { type: "application/x-msdownload" });
    const result = await uploadAttachment(app.id, "CV", file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/PDF et DOCX/);
    }
  });

  it("rejects an applicationId that does not correspond to a real application", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "cv.pdf", { type: "application/pdf" });
    const result = await uploadAttachment("../../../../tmp/evil", "CV", file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/introuvable/i);
    }
  });
});
