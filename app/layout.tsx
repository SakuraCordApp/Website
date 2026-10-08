import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./community.css";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

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
        url: "/discord-preview-macbook-20261008.png",
        width: 3200,
        height: 1680,
        alt: "SakuraCord running on a MacBook beneath the SakuraCord wordmark",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SakuraCord - Discord, at home on the Mac.",
    description:
      "A fast native Discord client for macOS with full voice and video support.",
    images: ["/discord-preview-macbook-20261008.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ef9bc4",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved appearance before first paint so pages never flash the wrong one. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){var t="system";try{t=localStorage.getItem("sc-theme")||"system"}catch(e){}var r=document.documentElement;r.classList.toggle("dark",t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches));r.dataset.theme=t;r.classList.add("js")})();',
          }}
        />
      </head>
      <body>
        {/* Register before the router so tracker-only history can stay local. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.addEventListener("popstate",function(event){window.sakuracordTrackerHistory?.(event)},true);',
          }}
        />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
