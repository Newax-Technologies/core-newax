import type { MetadataRoute } from 'next';

const NON_PUBLIC_PATHS = [
  '/admin/',
  '/api/',
  '/app/',
  '/auth/',
  '/dashboard/',
  '/internal/',
] as const;

export default function robots(): MetadataRoute.Robots {
  const indexingEnabled = process.env.SEARCH_INDEXING_ENABLED === 'true';

  if (!indexingEnabled) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...NON_PUBLIC_PATHS],
    },
  };
}
