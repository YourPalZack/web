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
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aquabuilder',
    title: 'AquaBuilder',
    description: 'Configure compatible aquarium builds and track prices.',
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
            </nav>
            <div className="ml-auto"><HeaderAdminChip /></div>
          </div>
        </header>
        <main>{children}</main>
        <AdminIndicator />
        <ToastContainer />
      </body>
    </html>
  );
}
import Link from 'next/link';
