import { existsSync } from 'fs';
import { join } from 'path';

export const PDF_LOGO_FILENAME = 'logo.png';
export const PDF_ARABIC_FONT_FILENAME = 'NotoNaskhArabic-Regular.ttf';

function assetCandidates(...parts: string[]): string[] {
  return [
    join(process.cwd(), 'assets', ...parts),
    join(process.cwd(), 'apps', 'api', 'assets', ...parts),
    join(__dirname, '..', '..', '..', '..', 'assets', ...parts),
    join(__dirname, '..', '..', '..', '..', '..', 'assets', ...parts),
  ];
}

export function resolvePdfAsset(...parts: string[]): string | null {
  return assetCandidates(...parts).find((candidate) => existsSync(candidate)) ?? null;
}

export function resolvePdfLogoPath(): string | null {
  return resolvePdfAsset(PDF_LOGO_FILENAME);
}

export function resolvePdfArabicFontPath(): string | null {
  return (
    resolvePdfAsset('fonts', PDF_ARABIC_FONT_FILENAME) ??
    resolvePdfAsset('fonts', 'arabic.ttf') ??
    [
      'C:\\Windows\\Fonts\\tahoma.ttf',
      'C:\\Windows\\Fonts\\arial.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ].find((candidate) => existsSync(candidate)) ??
    null
  );
}
