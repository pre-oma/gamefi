import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gamefi Invest - Build Your Investment Dream Team",
  description: "A gamified social investment platform where you build investment portfolios like soccer teams. Track performance, compete on leaderboards, and learn investing through play.",
  keywords: ["investment", "portfolio", "gamification", "soccer", "finance", "trading"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
