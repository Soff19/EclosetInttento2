import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ECloset",
  description: "Your sustainable wardrobe",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${nunitoSans.variable} ${cormorantGaramond.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans" style={{ background: "#F9F5F0", color: "#1a1a1a" }}>
        {children}
      </body>
    </html>
  );
}
