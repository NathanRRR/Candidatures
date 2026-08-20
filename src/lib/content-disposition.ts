// Node's header validation throws (surfacing as an unhandled 500) for any
// Content-Disposition filename that contains a character outside Latin-1,
// which breaks on ordinary French filenames (e.g. an em dash or accented
// letter). Use the RFC 5987 extended syntax (filename*=UTF-8''...) for the
// real value, alongside a sanitized plain-ASCII filename="..." fallback for
// older clients that don't understand filename*=.
export function buildAttachmentContentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
