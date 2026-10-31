declare module "officecrypto-tool" {
  interface EncryptOptions {
    password: string;
    type?: "standard" | "agile";
  }
  interface DecryptOptions {
    password: string;
  }
  const officeCrypto: {
    encrypt(input: Buffer, options: EncryptOptions): Buffer;
    decrypt(input: Buffer, options: DecryptOptions): Promise<Buffer>;
    isEncrypted(input: Buffer): boolean;
  };
  export default officeCrypto;
}

declare module "file-type-mime" {
  export function parse(buffer: Buffer | ArrayBuffer): { ext: string; mime: string } | undefined;
}
