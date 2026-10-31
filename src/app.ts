import express, { NextFunction, Request, Response } from "express";
import createError, { HttpError } from "http-errors";
import multer from "multer";
import { config } from "./config";
import { encrypt } from "./controllers/protect.controller";
import { SUPPORTED_TYPES } from "./services/protect.service";

export function createApp(): express.Application {
  const app = express();
  const limit = config.maxUploadMb * 1024 * 1024;

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: limit, files: 1 },
  });

  // Raw bodies for direct uploads with a document Content-Type.
  app.use(express.raw({ type: (req) => SUPPORTED_TYPES.has(req.headers["content-type"]?.split(";")[0].trim() ?? ""), limit }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", supportedTypes: [...SUPPORTED_TYPES] });
  });

  app.post("/encrypt", upload.single("file"), encrypt);

  app.use((_req, _res, next) => next(createError(404, "Not found")));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ message: `File exceeds ${config.maxUploadMb} MB limit` });
      return;
    }
    const status = (err as HttpError).status ?? (err as HttpError).statusCode ?? 500;
    const message = status < 500 ? (err as Error).message : "Internal server error";
    if (status >= 500) console.error(err);
    res.status(status).json({ message });
  });

  return app;
}
