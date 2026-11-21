import { open } from 'fs/promises';

/** Reads the first bytes of a file on disk. */
export const readHead = async (path: string, length = 32): Promise<Buffer> => {
  const fh = await open(path, 'r');
  try {
    const buf = Buffer.alloc(length);
    const { bytesRead } = await fh.read(buf, 0, length, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
};

const startsWith = (b: Buffer, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);
const ascii = (b: Buffer, start: number, end: number) => b.toString('latin1', start, end);

/**
 * Checks the leading bytes against the declared mime type. Types without a known signature
 * (docx/xlsx are zip containers) are checked as a zip (PK\x03\x04).
 */
export const matchesMagicBytes = (head: Buffer, mime: string): boolean => {
  switch ((mime ?? '').toLowerCase()) {
    case 'image/jpeg':
      return startsWith(head, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/webp':
      return head.length >= 12 && ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP';
    case 'video/mp4':
    case 'video/quicktime':
      // ISO base media: "ftyp" box at offset 4 (mov may also start with moov/mdat/wide/free/skip).
      return head.length >= 12 && (ascii(head, 4, 8) === 'ftyp' || ['moov', 'mdat', 'wide', 'free', 'skip'].includes(ascii(head, 4, 8)));
    case 'application/pdf':
      // The %PDF- header may be preceded by up to 1024 bytes of junk in theory; we require it at the start.
      return ascii(head, 0, 5) === '%PDF-';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return startsWith(head, [0x50, 0x4b, 0x03, 0x04]);
    default:
      return false;
  }
};

export const fileMatchesMime = async (path: string, mime: string): Promise<boolean> => {
  try {
    return matchesMagicBytes(await readHead(path), mime);
  } catch {
    return false;
  }
};
