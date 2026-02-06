import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { SessionProvider } from "@/components/providers/SessionProvider"

import { FavoritesProvider } from "@/components/providers/FavoritesProvider"
import { getFavorites } from "@/actions/favorites"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Tech Hub - Tu Tienda de Tecnologia",
  description: "Los mejores productos de computacion: PCs, monitores, teclados, mouse y mas. Envio a toda Argentina.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const favorites = await getFavorites()

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <FavoritesProvider initialFavorites={favorites}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </FavoritesProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
