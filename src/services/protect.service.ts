import { PDFDocument } from "@cantoo/pdf-lib";
import officeCrypto from "officecrypto-tool";
import { parse as sniffMime } from "file-type-mime";

export const PDF = "application/pdf";
export const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export const SUPPORTED_TYPES: ReadonlySet<string> = new Set([PDF, DOCX, XLSX, PPTX]);

export class UnsupportedFileTypeError extends Error {
  constructor(public readonly mimeType: string | undefined) {
    super(`Unsupported file type: ${mimeType ?? "unknown"}`);
    this.name = "UnsupportedFileTypeError";
  }
}

/**
 * Detects the MIME type from the file's magic bytes. The client-declared type
 * is only used as a fallback when sniffing fails (for example, an empty file).
 */
export function detectMimeType(buffer: Buffer, declared?: string): string | undefined {
  const sniffed = sniffMime(buffer)?.mime;
  // OOXML files all sniff as zip; trust the declared OOXML type in that case.
  if (sniffed === "application/zip" && declared && SUPPORTED_TYPES.has(declared)) {
    return declared;
  }
  return sniffed ?? declared;
}

/**
 * Encrypts a PDF with AES-256. The same password is used as user and owner
 * password; the user may print at high resolution but not modify or copy.
 * Pure JavaScript: no native binaries or temp files involved.
 */
export async function protectPdf(input: Buffer, password: string): Promise<Buffer> {
  const doc = await PDFDocument.load(input, { ignoreEncryption: false });
  doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: { printing: "highResolution", modifying: false, copying: false, annotating: false },
  });
  return Buffer.from(await doc.save({ useObjectStreams: false }));
}

/** Encrypts a DOCX, XLSX or PPTX using the standard OOXML agile encryption. */
export async function protectOffice(input: Buffer, password: string): Promise<Buffer> {
  return officeCrypto.encrypt(input, { password });
}

export interface ProtectResult {
  mimeType: string;
  buffer: Buffer;
}

export async function protectDocument(
  input: Buffer,
  password: string,
  declaredMimeType?: string,
): Promise<ProtectResult> {
  const mimeType = detectMimeType(input, declaredMimeType);
  if (!mimeType || !SUPPORTED_TYPES.has(mimeType)) {
    throw new UnsupportedFileTypeError(mimeType);
  }
  const buffer = mimeType === PDF ? await protectPdf(input, password) : await protectOffice(input, password);
  return { mimeType, buffer };
}
