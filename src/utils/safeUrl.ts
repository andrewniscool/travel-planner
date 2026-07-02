const ALLOWED_REMOTE_PROTOCOLS = new Set(['http:', 'https:']);

export function getSafeExternalUrl(value?: string | null): string | undefined {
  if (!value) return undefined;

  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;

  try {
    const url = new URL(trimmedValue);
    return ALLOWED_REMOTE_PROTOCOLS.has(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export const getSafeImageUrl = getSafeExternalUrl;
