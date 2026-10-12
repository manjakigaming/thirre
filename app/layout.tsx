
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thirre.vercel.app"),
  title: "THIRRE | Gjej profesionistin e duhur në Kosovë",
  description:
    "Gjej elektricistë, hidraulikë, pastrues dhe mjeshtër renovimesh në Kosovë me platformën THIRRE.",
  applicationName: "THIRRE",
  openGraph: {
    title: "THIRRE | Gjej profesionistin e duhur në Kosovë",
    description:
      "Gjej mjeshtrin që të duhet. Zbulo profesionistë në Kosovë me THIRRE.",
    url: "https://thirre.vercel.app/",
    siteName: "THIRRE",
    locale: "sq_XK",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "THIRRE | Profesionistë në Kosovë",
    description:
      "Gjej elektricistë, hidraulikë, pastrues dhe mjeshtër renovimesh.",
  },
  keywords: [
    "THIRRE",
    "profesionistë në Kosovë",
    "elektricistë",
    "hidraulikë",
    "pastrim",
    "renovime",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="sq"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
