import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "./components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Özdemir Makina",
  description: "Özdemir Makina Admin",
  icons: {
    icon: [
      { url: '/LogoO.svg', media: '(prefers-color-scheme: light)' },
      { url: '/LogoOBeyaz.svg', media: '(prefers-color-scheme: dark)' },
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
