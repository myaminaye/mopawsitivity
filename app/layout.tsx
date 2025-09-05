import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { TeamProvider } from "./context/TeamContext";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mopawsitivity",
  description: "Cute cat landing + NBA players & Teams demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geistMono.className}>
      <body>
        <AuthProvider>
          <TeamProvider>{children}</TeamProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
