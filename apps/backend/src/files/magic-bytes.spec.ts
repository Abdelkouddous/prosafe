import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileMatchesMime, matchesMagicBytes } from './magic-bytes';

const buf = (...b: number[]) => Buffer.from(b);
const mp4 = Buffer.concat([buf(0, 0, 0, 0x18), Buffer.from('ftypisom'), Buffer.alloc(8)]);
const webp = Buffer.concat([Buffer.from('RIFF'), buf(1, 2, 3, 4), Buffer.from('WEBPVP8 ')]);

describe('magic bytes', () => {
  it('accepts valid signatures', () => {
    expect(matchesMagicBytes(buf(0xff, 0xd8, 0xff, 0xe0, 0, 0), 'image/jpeg')).toBe(true);
    expect(matchesMagicBytes(buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0), 'image/png')).toBe(true);
    expect(matchesMagicBytes(webp, 'image/webp')).toBe(true);
    expect(matchesMagicBytes(mp4, 'video/mp4')).toBe(true);
    expect(matchesMagicBytes(mp4, 'video/quicktime')).toBe(true);
    expect(matchesMagicBytes(Buffer.from('%PDF-1.7\n'), 'application/pdf')).toBe(true);
  });

  it('rejects mismatching content', () => {
    expect(matchesMagicBytes(Buffer.from('%PDF-1.7'), 'image/jpeg')).toBe(false);
    expect(matchesMagicBytes(Buffer.from('<?php echo 1;'), 'image/png')).toBe(false);
    expect(matchesMagicBytes(mp4, 'application/pdf')).toBe(false);
    expect(matchesMagicBytes(Buffer.alloc(0), 'image/jpeg')).toBe(false);
    expect(matchesMagicBytes(buf(0xff, 0xd8, 0xff), 'text/html')).toBe(false);
  });

  it('checks a file on disk', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'magic-'));
    try {
      const good = join(dir, 'a.pdf');
      const bad = join(dir, 'b.jpg');
      writeFileSync(good, '%PDF-1.4 data');
      writeFileSync(bad, 'not an image');
      expect(await fileMatchesMime(good, 'application/pdf')).toBe(true);
      expect(await fileMatchesMime(bad, 'image/jpeg')).toBe(false);
      expect(await fileMatchesMime(join(dir, 'missing'), 'image/jpeg')).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
