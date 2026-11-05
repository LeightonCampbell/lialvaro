const MAX_FILE_BYTES = 8 * 1024 * 1024;

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, length: number): string {
  return String.fromCharCode(...bytes.slice(0, length));
}

function allowedBinary(bytes: Uint8Array): boolean {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return true;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return true;
  if (ascii(bytes, 6) === 'GIF87a' || ascii(bytes, 6) === 'GIF89a') return true;
  if (ascii(bytes, 4) === 'RIFF' && ascii(bytes.slice(8), 4) === 'WEBP') return true;
  if (ascii(bytes, 4) === '%PDF') return true;
  if (ascii(bytes, 4) === '%!PS') return true;
  if (startsWith(bytes, [0xc5, 0xd0, 0xd3, 0xc6])) return true;
  if (startsWith(bytes, [0x50, 0x4b])) return true;
  return false;
}

export async function uploadRejection(file: File): Promise<string | null> {
  if (file.size > MAX_FILE_BYTES) return 'Each file must be 8 MB or smaller.';
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const name = file.name.toLowerCase();
  const svgName = name.endsWith('.svg') || file.type === 'image/svg+xml';
  if (svgName) {
    const text = await file.slice(0, 8192).text();
    if (!/<svg[\s>]/i.test(text) && !/<\?xml/i.test(text)) {
      return 'Upload a PNG, JPG, GIF, WEBP, SVG, PDF, AI, EPS, or ZIP file.';
    }
    if (/<script/i.test(text)) return 'SVG files cannot include scripts.';
    return null;
  }
  if (!allowedBinary(head)) {
    return 'Upload a PNG, JPG, GIF, WEBP, SVG, PDF, AI, EPS, or ZIP file.';
  }
  return null;
}
