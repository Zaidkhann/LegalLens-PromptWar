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
        <DisclaimerBanner />
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
