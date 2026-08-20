import { describe, it, expect } from "vitest";
import { buildAttachmentContentDisposition } from "@/lib/content-disposition";

describe("buildAttachmentContentDisposition", () => {
  it("builds a plain header for an ASCII filename", () => {
    const header = buildAttachmentContentDisposition("cv.pdf");
    expect(header).toBe(`attachment; filename="cv.pdf"; filename*=UTF-8''cv.pdf`);
  });

  it("does not throw and produces a valid header value for a filename with non-Latin1 characters", () => {
    const filename = "Lettre de motivation — Société.pdf";
    expect(() => buildAttachmentContentDisposition(filename)).not.toThrow();
    const header = buildAttachmentContentDisposition(filename);
    // The ASCII fallback must contain no character outside the Latin-1 header-safe range.
    const asciiFallbackMatch = header.match(/filename="([^"]*)"/);
    expect(asciiFallbackMatch).not.toBeNull();
    expect(asciiFallbackMatch![1]).toMatch(/^[\x20-\x7E]*$/);
    // The extended form carries the exact original filename, percent-encoded.
    expect(header).toContain(`filename*=UTF-8''${encodeURIComponent(filename)}`);
    // This is the actual bug from the review: setting a header with a raw
    // em dash/accented character throws in Node. Confirm the real header
    // machinery accepts our value.
    expect(() => new Headers({ "Content-Disposition": header })).not.toThrow();
  });

  it("escapes embedded double quotes in the ASCII fallback", () => {
    const header = buildAttachmentContentDisposition('weird"name.pdf');
    const asciiFallbackMatch = header.match(/filename="([^"]*)"/);
    expect(asciiFallbackMatch![1]).not.toContain('"');
  });
});
