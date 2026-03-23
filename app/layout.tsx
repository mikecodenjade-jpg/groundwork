import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import PWAInit from "@/components/PWAInit";
import InstallPrompt from "@/components/InstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://buildmygroundwork.com"),
  title: "Build My Groundwork - Wellness for Construction Professionals",
  description:
    "Fitness, mental health, and leadership tools built by the construction industry, for the construction industry.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Groundwork",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  openGraph: {
    title: "Build My Groundwork - Wellness for Construction Professionals",
    description:
      "Fitness, mental health, and leadership tools built by the construction industry, for the construction industry.",
    url: "https://buildmygroundwork.com",
    siteName: "Build My Groundwork",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Build My Groundwork" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-inter)" }}>
        <PWAInit />
        <OfflineIndicator />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
