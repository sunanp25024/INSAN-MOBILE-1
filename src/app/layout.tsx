import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import NativeFeatureInitializer from '@/components/native-feature-initializer';
import PerformanceMonitor from '@/components/performance-monitor';

export const metadata: Metadata = {
  title: 'PARA KURIR',
  description: 'Aplikasi Mobile untuk Manajemen Pengiriman',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PARA KURIR',
  },
  applicationName: 'PARA KURIR',
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Apple touch icon - placed at the beginning of head as recommended */}
        <link rel="apple-touch-icon" sizes="180x180" href="/web-app-manifest-192x192.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Optimized font loading with font-display: swap */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Preload critical CSS */}
        <link rel="preload" href="/globals.css" as="style" />
        
        {/* Optimized icon references with correct extensions */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.svg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.svg" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#ffffff" />
        
        {/* PWA and theme configuration */}
        <meta name="msapplication-TileColor" content="#ffffff" />
        {/* Theme color with color-scheme as alternative for better cross-browser support */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
        
        {/* Preload critical scripts */}
        <link rel="preload" href="/register-sw.js" as="script" />
        <script src="/register-sw.js" defer></script>
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://placehold.co" />
      </head>
      <body className="font-body antialiased">
        <PerformanceMonitor />
        <NativeFeatureInitializer />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
