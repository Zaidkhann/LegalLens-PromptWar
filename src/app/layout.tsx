import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DisclaimerBanner } from '@/components/layout/DisclaimerBanner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LegalLens | GenAI Legal Document Intelligence Platform',
  description: 'Understand, navigate, compare, and prepare for legal contracts with plain-language GenAI document intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <DisclaimerBanner />
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
