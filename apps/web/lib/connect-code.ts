export function parseConnectCodeParam(param: string): string {
  const decoded = decodeURIComponent(param);
  if (decoded.includes('#')) return decoded;
  const idx = decoded.lastIndexOf('-');
  if (idx <= 0) return decoded;
  return `${decoded.slice(0, idx)}#${decoded.slice(idx + 1)}`;
}

export function connectCodeToPathSegment(code: string): string {
  return encodeURIComponent(code.replace('#', '-'));
}
