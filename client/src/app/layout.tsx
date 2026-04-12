import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "GS Starter — Next.js + Google Services",
  description: "Next.js + Express with Google Calendar, Sheets, Drive & Gmail pre-configured.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen antialiased pt-16" suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
