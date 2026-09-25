import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CurrencyProvider } from "@/lib/currency";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Moodify 2.0: JEV sentiment app", template: "%s · Moodify 2.0" },
  description: "Sentiment analysis with TypeSafe's JEV, compared side by side with Moodify's fine-tuned BERT.",
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
