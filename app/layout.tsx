import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono, Montserrat, Inter } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import QueryProvider from '@/components/QueryProvider'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin'], weight: ['600', '700', '800', '900'] })
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'TU MUNDIAL - Tus Predicciones',
  description: 'Pronosticá los partidos del Mundial 2026 y competí con amigos.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'TU MUNDIAL - Tus Predicciones',
    description: 'Pronosticá los partidos del Mundial 2026 y competí con amigos.',
    url: 'https://tu-mundial.vercel.app',
    siteName: 'TU MUNDIAL',
    images: [
      {
        url: 'https://tu-mundial.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TU MUNDIAL - Tus Predicciones',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TU MUNDIAL - Tus Predicciones',
    description: 'Pronosticá los partidos del Mundial 2026 y competí con amigos.',
    images: ['https://tu-mundial.vercel.app/og-image.png'],
  },
}

// Inline script para prevenir el flash de tema incorrecto (FOUC)
const themeScript = `(function(){try{var t=localStorage.getItem('predique-theme');if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2739632046843917"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
