import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MantineProvider } from '@mantine/core';
import { createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "1440",
  initialScale: 1,
  maximumScale: 1
};

export const metadata: Metadata = {
  title: "Job Admin Dashboard",
  description: "Job administration and management dashboard"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <MantineProvider
          theme={createTheme({
            fontFamily: 'var(--font-satoshi)',
            headings: {
              fontFamily: 'var(--font-satoshi)',
              fontWeight: '600',
            },
            components: {
              Container: {
                defaultProps: {
                  fluid: true,
                  size: '1360px',
                },
              },
            },
          })}
        >
          <div className="container">
            {children}
          </div>
        </MantineProvider>
      </body>
    </html>
  );
}
