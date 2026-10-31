import request from "supertest";
import { PDFDocument } from "@cantoo/pdf-lib";
import { createApp } from "../src/app";

async function makePdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  return Buffer.from(await doc.save());
}

function isEncryptedPdf(buf: Buffer): boolean {
  return buf.includes("/Encrypt");
}

describe("POST /encrypt", () => {
  const app = createApp();

  it("reports health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.supportedTypes).toContain("application/pdf");
  });

  it("rejects an empty request", async () => {
    const res = await request(app).post("/encrypt");
    expect(res.status).toBe(400);
  });

  it("rejects unsupported file types", async () => {
    const res = await request(app).post("/encrypt").attach("file", Buffer.from("hello"), "note.txt");
    expect(res.status).toBe(415);
  });

  it("rejects a weak supplied password", async () => {
    const pdf = await makePdf();
    const res = await request(app).post("/encrypt").set("x-password", "weak").attach("file", pdf, "a.pdf");
    expect(res.status).toBe(400);
  });

  it("encrypts a multipart PDF and returns a generated password", async () => {
    const pdf = await makePdf();
    expect(isEncryptedPdf(pdf)).toBe(false);
    const res = await request(app).post("/encrypt").attach("file", pdf, "report.pdf").buffer(true).parse(binaryParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["x-password"]).toMatch(/^.{14,28}$/);
    expect(res.headers["content-disposition"]).toContain('filename="protected_report.pdf"');
    expect(isEncryptedPdf(res.body as Buffer)).toBe(true);
  });

  it("encrypts a raw-body PDF with a supplied password", async () => {
    const pdf = await makePdf();
    const password = "Str0ng!Passw0rd#2026";
    const res = await request(app)
      .post("/encrypt")
      .set("Content-Type", "application/pdf")
      .set("x-filename", "raw.pdf")
      .set("x-password", password)
      .send(pdf)
      .buffer(true)
      .parse(binaryParser);
    expect(res.status).toBe(200);
    expect(res.headers["x-password"]).toBe(password);
    expect(isEncryptedPdf(res.body as Buffer)).toBe(true);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function binaryParser(res: any, callback: (err: Error | null, body: Buffer) => void): void {
  const chunks: Buffer[] = [];
  res.on("data", (c: Buffer) => chunks.push(c));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
}
