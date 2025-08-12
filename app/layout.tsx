import type React from "react"
import type { Metadata } from "next"
// import { Inter } from "next/font/google" // Temporarily disabled for development
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

// const inter = Inter({ subsets: ["latin"] }) // Temporarily disabled

export const metadata: Metadata = {
  title: "Treasure Hunt - Supermal Karawaci",
  description: "Progressive Web App untuk treasure hunt kemerdekaan di Supermal Karawaci",
  manifest: "/manifest.json",
  themeColor: "#D4AF37",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Treasure Hunt",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`bg-primary text-text-light`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
