export function toBase64(source: string | number): string {
  return Buffer.from('' + source).toString('base64');
}
export function fromBase64(source: string): string {
  return Buffer.from(source, 'base64').toString('ascii');
}
