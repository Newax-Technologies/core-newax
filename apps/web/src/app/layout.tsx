import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  applicationName: 'NEWAX',
  title: {
    default: 'NEWAX',
    template: '%s | NEWAX',
  },
  description:
    'NEWAX is the Business Infrastructure Company. We build the systems modern organizations depend on.',
};

interface RootLayoutProperties {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
