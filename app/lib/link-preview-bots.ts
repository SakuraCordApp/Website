// Crawlers that unfurl links into previews. iMessage fetches as
// facebookexternalhit/Facebot, and WhatsApp as WhatsApp.
const LINK_PREVIEW_BOT =
  /discordbot|slackbot|slack-imgproxy|twitterbot|telegrambot|facebookexternalhit|facebot|whatsapp|linkedinbot|skypeuripreview|redditbot|embedly|mastodon|bluesky|vkshare|pinterest/i;

export function isLinkPreviewBot(userAgent: string | null | undefined) {
  return LINK_PREVIEW_BOT.test(userAgent ?? "");
}
