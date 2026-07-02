import { describe, expect, it } from 'vitest';
import { getSafeExternalUrl, getSafeImageUrl } from './safeUrl';

describe('safeUrl', () => {
  it('allows absolute HTTP and HTTPS URLs', () => {
    expect(getSafeExternalUrl('https://example.com/path?q=1')).toBe(
      'https://example.com/path?q=1',
    );
    expect(getSafeExternalUrl(' http://example.com/path ')).toBe(
      'http://example.com/path',
    );
  });

  it('rejects non-remote or malformed URLs', () => {
    for (const value of [
      '',
      '   ',
      '/local/path',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'blob:https://example.com/id',
      'ftp://example.com/file',
      'not a url',
    ]) {
      expect(getSafeExternalUrl(value)).toBeUndefined();
    }
  });

  it('uses the same protocol policy for image URLs', () => {
    expect(getSafeImageUrl('https://images.example.com/photo.jpg')).toBe(
      'https://images.example.com/photo.jpg',
    );
    expect(getSafeImageUrl('data:image/svg+xml,<svg />')).toBeUndefined();
  });
});
