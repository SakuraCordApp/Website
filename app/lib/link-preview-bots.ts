// User-agent fragments of crawlers that unfurl links into previews.
const LINK_PREVIEW_BOTS = [
  "discordbot",
  "slackbot",
  "slack-imgproxy",
  "twitterbot",
  "telegrambot",
  // iMessage fetches as facebookexternalhit/Facebot.
  "facebookexternalhit",
  "facebot",
  "whatsapp",
  "linkedinbot",
  "skypeuripreview",
  "microsoftpreview",
  "redditbot",
  "embedly",
  "iframely/",
  "mastodon",
  "bluesky",
  "vkshare",
  // Pinterest's in-app browser also says "Pinterest", so match its crawler.
  "pinterestbot",
  "pinterest/0.",
  "googlemessages",
  "snap url preview service",
];

export function isLinkPreviewBot(userAgent: string | null) {
  const agent = userAgent?.toLowerCase() ?? "";
  return LINK_PREVIEW_BOTS.some((bot) => agent.includes(bot));
}
