import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeScript } from '@/components/ui/ThemeScript'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { DataProvider } from '@/components/ui/DataProvider'

export const metadata: Metadata = {
  title: 'Auto Premium — Gestão de Estoque',
  description: 'Sistema de gestão de estoque para concessionárias',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
