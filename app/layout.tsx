import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Study Agent',
  description: 'AI study companion with notes and image generation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
