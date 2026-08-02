import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sakuracord.app"),
  title: "SakuraCord - Native Discord for macOS",
  description:
    "Download SakuraCord, a fast native Discord client for macOS with full voice and video support.",
  applicationName: "SakuraCord",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/brand/favicon.png",
    shortcut: "/brand/favicon.png",
    apple: "/brand/sakuracord-app-icon.png",
  },
  openGraph: {
    type: "website",
    title: "SakuraCord - Discord, at home on the Mac.",
    description:
      "A fast native Discord client for macOS with full voice and video support.",
    images: [
      {
        url: "/og-v2.png",
        width: 1200,
        height: 630,
        alt: "SakuraCord branding above a real screenshot of the macOS client",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SakuraCord - Discord, at home on the Mac.",
    description:
      "A fast native Discord client for macOS with full voice and video support.",
    images: ["/og-v2.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0c13",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
