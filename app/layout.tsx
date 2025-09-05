import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { TeamProvider } from "./context/TeamContext";
import Providers from "./providers";

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
        <Providers>
        {/* <AuthProvider> */}
          <TeamProvider>{children}</TeamProvider>
          {/* </AuthProvider> */}
          </Providers>
      </body>
    </html>
  );
}
