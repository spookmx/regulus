import type { Metadata } from 'next';
import '@ebay/skin/tokens.css';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeProvider';

export const metadata: Metadata = {
  title: 'Regulus | Multi-Agent Regulatory Compliance & Traceability System',
  description: 'Enterprise AI Governance, Traceability and Decision Tracking under EU AI Act, DORA, ESG, MiCA, and GDPR.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-ebay-bg-primary text-ebay-fg-primary transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
