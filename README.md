# document-protection-service

A small HTTP service that password-protects documents. Upload a PDF, DOCX, XLSX or PPTX and get back an encrypted copy plus the password used. Built for a workflow where sensitive documents had to be locked before being emailed to customers.

- PDFs are encrypted with AES-256 via [@cantoo/pdf-lib](https://github.com/cantoo-scribe/pdf-lib) (user and owner password, print-only permissions). Pure JavaScript, no native binaries.
- Office files use standard OOXML agile encryption via [officecrypto-tool](https://github.com/Heroinman/officecrypto-tool), so they open with the password in Word, Excel and PowerPoint.
- File type is detected from magic bytes, not from the file extension.
- Passwords are generated with `crypto.randomInt` and follow a 14 to 28 character policy with mixed classes. A caller may supply their own password, which is checked against the same policy.
- Everything happens in memory; nothing is written to disk.

## API

### `POST /encrypt`

Two ways to send the document:

1. Multipart form with the file in field `file`.
2. Raw body with `Content-Type` set to the document's MIME type and an optional `x-filename` header.

Optional request header `x-password`: use this password instead of generating one.

Response: the encrypted document as a download. Headers:

| Header | Meaning |
|---|---|
| `Content-Type` | Same MIME type as the input |
| `Content-Disposition` | `attachment; filename="protected_<original name>"` |
| `x-password` | The password that opens the document |

Errors are JSON `{ "message": "..." }` with status 400 (bad request or weak password), 413 (too large), 415 (unsupported type).

```bash
curl -s -D headers.txt -o protected.pdf \
  -F file=@report.pdf http://localhost:3001/encrypt
grep -i x-password headers.txt
```

### `GET /health`

Returns `{ "status": "ok", "supportedTypes": [...] }`.

## Running

```bash
cp .env.example .env
npm install
npm run dev        # ts-node with reload
npm run build && npm start
npm test
```

Docker:

```bash
docker build -t document-protection-service .
docker run -p 3001:3001 document-protection-service
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `MAX_UPLOAD_MB` | `25` | Upload size limit |
| `PASSWORD_MIN_LENGTH` | `14` | Generated / accepted password minimum |
| `PASSWORD_MAX_LENGTH` | `28` | Generated / accepted password maximum |

## Layout

```
src/
  server.ts                  entry point
  app.ts                     express app, routes, error handler
  config.ts                  env parsing
  controllers/protect.controller.ts
  services/password.service.ts   generate + validate passwords
  services/protect.service.ts    MIME sniffing, PDF and Office encryption
test/                        jest + supertest
```

## License

MIT
