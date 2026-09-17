import type { Metadata } from "next";
export function communityMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      images: [
        {
          url: "/brand/sakuracord-app-icon.png",
          width: 1024,
          height: 1024,
          alt: "SakuraCord",
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/brand/sakuracord-app-icon.png"],
    },
  };
}
