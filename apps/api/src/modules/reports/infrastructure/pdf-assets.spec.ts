import { existsSync } from 'fs';
import { join } from 'path';

import {
  PDF_ARABIC_FONT_FILENAME,
  PDF_LOGO_FILENAME,
  resolvePdfArabicFontPath,
  resolvePdfLogoPath,
} from './pdf-assets';

describe('pdf-assets', () => {
  it('resolves the branded logo when assets/logo.png is present', () => {
    const logoPath = resolvePdfLogoPath();
    const expected = [
      join(process.cwd(), 'assets', PDF_LOGO_FILENAME),
      join(process.cwd(), 'apps', 'api', 'assets', PDF_LOGO_FILENAME),
    ].find((candidate) => existsSync(candidate));

    if (expected) {
      expect(logoPath).toBe(expected);
    } else {
      expect(logoPath === null || existsSync(logoPath)).toBe(true);
    }
  });

  it('resolves an Arabic-capable font when available', () => {
    const fontPath = resolvePdfArabicFontPath();
    const bundled = [
      join(process.cwd(), 'assets', 'fonts', PDF_ARABIC_FONT_FILENAME),
      join(process.cwd(), 'apps', 'api', 'assets', 'fonts', PDF_ARABIC_FONT_FILENAME),
    ].find((candidate) => existsSync(candidate));

    if (bundled) {
      expect(fontPath).toBe(bundled);
    } else if (fontPath) {
      expect(existsSync(fontPath)).toBe(true);
    }
  });
});
