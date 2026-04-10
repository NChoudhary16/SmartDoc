import { Inter, Manrope, Newsreader, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic"],
});

import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "SmartDoc-AI | AI Command Center",
  description: "SmartDoc-AI — Modern dashboard for AI-powered document automation and team insights.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${newsreader.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="selection:bg-primary selection:text-white">
        <div className="bg-layer-1"></div>
        <div className="bg-layer-2"></div>
        <div className="bg-layer-3"></div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
