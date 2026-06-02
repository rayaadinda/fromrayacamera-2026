import localFont from "next/font/local"
import { JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const arialGreekSans = localFont({
  src: "../public/font/Arial Greek Regular.ttf",
  variable: "--font-sans",
  display: "swap",
  weight: "400",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const arialGreekHeading = localFont({
  src: "../public/font/Arial Greek Regular.ttf",
  variable: "--font-heading",
  display: "swap",
  weight: "400",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        "font-sans",
        arialGreekSans.variable,
        jetbrainsMono.variable,
        arialGreekHeading.variable
      )}
    >
      <body>
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
