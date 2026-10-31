import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import { config } from "../config";
import { generatePassword, isAcceptablePassword } from "../services/password.service";
import { protectDocument, UnsupportedFileTypeError } from "../services/protect.service";

/** Strip path separators and quotes so the name is safe in a header. */
function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "document";
  return base.replace(/["\r\n]/g, "").replace(/\s+/g, "_") || "document";
}

/**
 * POST /encrypt
 *
 * Accepts either a multipart upload (field "file") or a raw body with
 * Content-Type set to the document type and an optional "x-filename" header.
 * Optional "x-password" header supplies the password; otherwise one is
 * generated and returned in the "x-password" response header.
 */
export async function encrypt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let data: Buffer | undefined;
    let fileName: string;
    let declaredType: string | undefined;

    if (req.file) {
      data = req.file.buffer;
      fileName = req.file.originalname;
      declaredType = req.file.mimetype;
    } else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      data = req.body;
      fileName = (req.headers["x-filename"] as string | undefined) ?? "document";
      declaredType = req.headers["content-type"]?.split(";")[0].trim();
    } else {
      throw createError(400, "No file uploaded. Send multipart field 'file' or a raw body.");
    }

    const supplied = req.headers["x-password"] as string | undefined;
    if (supplied !== undefined && !isAcceptablePassword(supplied, config.passwordMinLength, config.passwordMaxLength)) {
      throw createError(
        400,
        `Password must be ${config.passwordMinLength}-${config.passwordMaxLength} characters with lower, upper, digit and special characters.`,
      );
    }
    const password = supplied ?? generatePassword(config.passwordMinLength, config.passwordMaxLength);

    const result = await protectDocument(data, password, declaredType);

    res.setHeader("Content-Type", result.mimeType);
    res.setHeader("x-password", password);
    res.setHeader("Content-Disposition", `attachment; filename="protected_${safeFileName(fileName)}"`);
    res.status(200).end(result.buffer);
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      next(createError(415, "Unsupported file type. Accepted: PDF, DOCX, XLSX, PPTX."));
      return;
    }
    next(err);
  }
}
