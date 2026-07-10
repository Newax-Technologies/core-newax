import type { MetadataRoute } from 'next';

import { readWebEnvironment } from '../config/environment';

const NON_PUBLIC_PATHS = [
  '/admin/',
  '/api/',
  '/app/',
  '/auth/',
  '/dashboard/',
  '/internal/',
] as const;

export default function robots(): MetadataRoute.Robots {
  const { SEARCH_INDEXING_ENABLED } = readWebEnvironment();

  if (!SEARCH_INDEXING_ENABLED) {
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
