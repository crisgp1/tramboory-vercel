import type { Metadata } from "next";
import { Lexend, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import Providers from "@/components/providers/Providers";
import { Analytics } from "@vercel/analytics/next"

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tramboory",
  description: "Sistema de gestión y autenticación",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${lexend.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
