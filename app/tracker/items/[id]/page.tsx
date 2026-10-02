import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { communityMetadata } from "../../../lib/community-metadata";
import { getIssueDetail, resolveLegacyId } from "../../../lib/roadmap";
import { SeedDetail } from "../../seed-detail";
import ItemError from "./error";

type Props = { params: Promise<{ id: string }> };

async function loadItem(id: string) {
  if (!/^\d+$/.test(id)) {
    const number = await resolveLegacyId(id);
    if (number) permanentRedirect(`/tracker/items/${number}`);
    notFound();
  }
  let detail;
  try {
    detail = await getIssueDetail(Number(id));
  } catch {
    return null;
  }
  if (!detail) notFound();
  return detail;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await loadItem(id);
  return communityMetadata(
    item ? `${item.title} · SakuraCord Tracker` : "SakuraCord Tracker",
    item?.summary?.slice(0, 160) ??
      item?.sections[0]?.text.slice(0, 160) ??
      "Track SakuraCord bugs and suggestions.",
    `/tracker/items/${encodeURIComponent(id)}`,
  );
}

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const item = await loadItem(id);
  return item ? <SeedDetail detail={item} /> : <ItemError />;
}
