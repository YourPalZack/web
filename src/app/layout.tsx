import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from '@aquabuilder/ui';
import AdminIndicator from './admin-indicator';
import HeaderAdminChip from './header-admin-chip';
import { getSiteUrl } from '../lib/site';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '../lib/structured';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'AquaBuilder — Plan and Price Your Aquarium Build',
    template: '%s — AquaBuilder',
  },
  description: 'Configure compatible aquarium builds, compare parts, and track prices with affiliate links and community builds.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'AquaBuilder',
    description: 'Configure compatible aquarium builds and track prices.',
    url: '/',
    siteName: 'AquaBuilder',
    locale: 'en_US',
    type: 'website',
    images: [
      { url: `/api/og?title=${encodeURIComponent('AquaBuilder')}&subtitle=${encodeURIComponent('Build smart, compatible aquariums')}` },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aquabuilder',
    title: 'AquaBuilder',
    description: 'Configure compatible aquarium builds and track prices.',
    images: [`/api/og?title=${encodeURIComponent('AquaBuilder')}&subtitle=${encodeURIComponent('Build smart, compatible aquariums')}`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <header className="border-b">
          <div className="mx-auto max-w-6xl p-4 flex items-center gap-6">
            <Link href="/" className="font-semibold">AquaBuilder</Link>
            <nav className="text-sm text-gray-600 flex gap-4">
              <Link href="/build/new">Build</Link>
              <Link href="/browse">Browse</Link>
              <Link href="/community">Community</Link>
              <Link href="/faq">FAQ</Link>
            </nav>
            <div className="ml-auto"><HeaderAdminChip /></div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-12 border-t">
          <div className="mx-auto max-w-6xl p-6 text-xs text-gray-600 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              © {new Date().getFullYear()} AquaBuilder · <Link href="/faq" className="underline">FAQ</Link>
            </div>
            <div className="text-[11px] text-gray-500">
              Some links are affiliate links. Purchases may support the project at no extra cost.
            </div>
          </div>
        </footer>
        <AdminIndicator />
        <ToastContainer />
      </body>
    </html>
  );
}
import Link from 'next/link';
