import { AppShell } from "@/components/AppShell"
import { AuthProvider } from "@/components/auth/AuthProvider"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Instrument_Serif, Syne } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
})

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "STORYWORLD — Write a story. Step inside.",
  description: "A story that continuously switches between cinema and gameplay.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full text-white">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
