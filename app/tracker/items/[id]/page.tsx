import type { Metadata } from "next";
import { communityMetadata } from "../../../lib/community-metadata";
import { notFound } from "next/navigation";
import { getItems } from "../../../lib/roadmap";
import ItemError from "./error";

type Props = { params: Promise<{ id: string }> };
async function loadItem(id: string) {
  let items;
  try {
    items = await getItems();
  } catch {
    return null;
  }
  const item = items.find((item) => item.id === id);
  if (!item) notFound();
  return item;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await loadItem(id);
  return communityMetadata(
    item ? `${item.title} · SakuraCord Tracker` : "SakuraCord Tracker",
    item?.description.slice(0, 160) ??
      "Track features, fixes, and community reports.",
    `/tracker/items/${encodeURIComponent(id)}`,
  );
}
export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const item = await loadItem(id);
  return item ? null : <ItemError />;
}
