import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'IronPulse - Gym PWA & Coach IA',
  description: 'App PWA de gimnasio con generador de rutinas paso a paso con IA, plan de transformación física a 6 meses y seguimiento de progreso con gráficas detalladas.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IronPulse',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'IronPulse - Gym PWA & Coach IA',
    description: 'Rutinas con IA, plan de 6 meses y seguimiento de rendimiento con gráficas.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IronPulse - Gym PWA & Coach IA',
    description: 'Rutinas con IA, plan de 6 meses y seguimiento de rendimiento con gráficas.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark bg-[#050505] text-[#f4f4f5] antialiased selection:bg-white selection:text-black">
      <body className="min-h-screen bg-[#050505] text-[#f4f4f5] font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
