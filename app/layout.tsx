import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

import { cn } from "@/lib/utils/cn";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "StockFlow AI",
  description:
    "\uD55C\uAD6D \uD22C\uC790\uC790\uB97C \uC704\uD55C \uC8FC\uC2DD \uC790\uB3D9\uD654 AI \uC5D0\uC774\uC804\uD2B8 \uBE4C\uB354"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background text-foreground antialiased",
          inter.variable,
          ibmPlexMono.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
