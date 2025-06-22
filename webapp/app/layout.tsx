import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import { ChatProvider } from "./chat-provider"
import IceRaidMap from "@/components/map/map"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Immigration Rights Assistant",
  description: "Get reliable information about your rights when encountering immigration authorities",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  )
}
