import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'SyncSpace - Real-Time Collaborative Workspace',
    template: '%s | SyncSpace',
  },
  description: 'Collaborate in real time. Communicate clearly. Get work done together.',
  keywords: [
    'collaboration',
    'real-time',
    'workspace',
    'chat',
    'documents',
    'project management',
    'team communication',
  ],
  authors: [
    {
      name: 'SyncSpace Team',
      url: 'https://syncspace.com',
    },
  ],
  creator: 'SyncSpace Team',
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.APP_URL || 'http://localhost:3000',
    siteName: 'SyncSpace',
    title: 'SyncSpace - Real-Time Collaborative Workspace',
    description: 'Collaborate in real time. Communicate clearly. Get work done together.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SyncSpace - Real-Time Collaborative Workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SyncSpace - Real-Time Collaborative Workspace',
    description: 'Collaborate in real time. Communicate clearly. Get work done together.',
    images: ['/og-image.png'],
    creator: '@syncspace',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}