export const siteConfig = {
  name: 'AlMadina Uraan Group',
  description: 'Track pigeon racing tournaments, live results, rankings, and loft performance.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'info@kabootar.com',
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+923001234567',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '923001234567',
  whatsappMessage: 'Hello! I have a question about AlMadina Uraan Group tournaments.',
};

export const uploadsUrl = process.env.NEXT_PUBLIC_UPLOADS_URL ?? 'http://localhost:3000';

export function resolveBannerUrl(bannerImage: string | null | undefined): string | null {
  if (!bannerImage) return null;
  if (bannerImage.startsWith('http')) return bannerImage;
  const base = uploadsUrl.replace(/\/$/, '');
  const path = bannerImage.startsWith('/') ? bannerImage : `/${bannerImage}`;
  return `${base}${path}`;
}

export function whatsappLink(message = siteConfig.whatsappMessage): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
