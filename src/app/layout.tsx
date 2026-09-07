import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VULCANO-TRACK ID | Pemantauan Erupsi & Sebaran Abu Vulkanik Real-Time',
  description:
    'Sistem navigasi dan pelacakan sebaran abu vulkanik erupsi gunung berapi Indonesia (Gunung Anak Krakatau, Merapi, Semeru, dll.) terintegrasi data arah angin dan kualitas udara resmi.',
  keywords: [
    'erupsi gunung anak krakatau',
    'sebaran abu vulkanik',
    'magma indonesia',
    'pvmbg',
    'bmkg cuaca angin',
    'volcano ash tracker indonesia'
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark bg-zinc-950 text-zinc-100 antialiased h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Leaflet CSS from reliable Unpkg CDN */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {/* Leaflet JS from reliable Unpkg CDN */}
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
        ></script>
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-red-900/50 selection:text-white">
        {children}
      </body>
    </html>
  );
}
