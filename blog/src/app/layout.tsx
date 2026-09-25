import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CurrencyProvider } from "@/lib/currency";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "JEV Explained: the if/else of AI", template: "%s · JEV Explained" },
  description:
    "An interactive guide to JEV by TypeSafe AI, a System-1 decision model. What it is, how it differs from LLMs, RLCD calibration, architecture, use cases, limitations, and a BERT vs JEV lab.",
};

export const viewport: Viewport = { themeColor: "#07090d", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
