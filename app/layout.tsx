import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend, Manrope } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Diversonal - AI-Powered Portfolio Optimization",
  description: "Professional-grade portfolio allocation powered by advanced AI. Get personalized recommendations, stress test scenarios, and detailed stock picks.",
  openGraph: {
    title: "Diversonal - AI-Powered Portfolio Optimization",
    description: "Professional-grade portfolio allocation powered by advanced AI. Get personalized recommendations, stress test scenarios, and detailed stock picks.",
    url: "https://diversonal.com", // Replace with your actual domain
    siteName: "Diversonal",
    images: [
      {
        url: "/og-image.png", // You'll need to create this image
        width: 1200,
        height: 630,
        alt: "Diversonal - AI-Powered Portfolio Optimization",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diversonal - AI-Powered Portfolio Optimization",
    description: "Professional-grade portfolio allocation powered by advanced AI. Get personalized recommendations, stress test scenarios, and detailed stock picks.",
    images: ["/og-image.png"], // Same image as Open Graph
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} ${manrope.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
