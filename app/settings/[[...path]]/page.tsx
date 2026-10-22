import type { Metadata } from "next";
import Link from "next/link";

const title = "SakuraCord Settings Deeplink";
const description =
  "This is a SakuraCord settings deeplink. Open it in SakuraCord to use the linked setting. SakuraCord is a fast, native Discord client for macOS.";

type SettingsDeepLinkPageProps = {
  params: Promise<{ path?: string[] }>;
};

function settingsPath(path: string[] | undefined) {
  return `/settings${path?.length ? `/${path.join("/")}` : ""}`;
}

export async function generateMetadata({
  params,
}: SettingsDeepLinkPageProps): Promise<Metadata> {
  const { path } = await params;
  const url = settingsPath(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: "SakuraCord",
      title,
      description,
      images: [
        {
          url: "/brand/sakuracord-app-icon.png",
          width: 1024,
          height: 1024,
          type: "image/png",
          alt: "SakuraCord app icon",
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [
        {
          url: "/brand/sakuracord-app-icon.png",
          width: 1024,
          height: 1024,
          alt: "SakuraCord app icon",
        },
      ],
    },
  };
}

// Only link-preview bots reach this page; the worker sends people home.
export default function SettingsDeepLinkPage() {
  return (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link href="/">Visit the SakuraCord homepage</Link>
    </main>
  );
}
