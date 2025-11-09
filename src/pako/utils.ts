import pako from 'pako';

function toUrlBase64(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlBase64(base64: string): Uint8Array {
  const norm = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = norm + '==='.slice(0, (4 - norm.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export function stringCompress(src: string): string {
  const compressed = pako.deflate(src, { level: 9 });
  return toUrlBase64(compressed);
}

export function decompressString(b64: string): string {
  const bytes = fromUrlBase64(b64);
  return pako.inflate(bytes, { to: 'string' });
}