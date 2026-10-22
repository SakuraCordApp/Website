// Crawlers that unfurl links into previews. iMessage fetches as
// facebookexternalhit/Facebot, and WhatsApp as WhatsApp. Pinterest's crawler
// is matched by its bot names only: its in-app browser also says "Pinterest".
const LINK_PREVIEW_BOT =
  /discordbot|slackbot|slack-imgproxy|twitterbot|telegrambot|facebookexternalhit|facebot|whatsapp|linkedinbot|skypeuripreview|redditbot|embedly|mastodon|bluesky|vkshare|pinterestbot|pinterest\/0\.|googlemessages|snap url preview service|microsoftpreview|iframely\//i;

export function isLinkPreviewBot(userAgent: string | null | undefined) {
  return LINK_PREVIEW_BOT.test(userAgent ?? "");
}
