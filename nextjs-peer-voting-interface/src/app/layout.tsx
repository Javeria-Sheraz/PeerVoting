import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PeerVote | Anonymous Class Voting",
  description: "Secure, anonymous peer-voting for the class of 2024mc.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#121212] text-[#f5f5f5] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
