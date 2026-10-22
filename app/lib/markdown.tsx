import type { ReactNode } from "react";

/** Inline Markdown: links, bold and code. Rendered as elements, never as HTML. */
function inline(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > last) parts.push(text.slice(last, match.index));
    const key = `${keyBase}-${match.index}`;
    if (match[2])
      parts.push(
        <a key={key} href={match[2]} target="_blank" rel="noreferrer">
          {match[1]}
        </a>,
      );
    else if (match[3]) parts.push(<strong key={key}>{match[3]}</strong>);
    else parts.push(<code key={key}>{match[4]}</code>);
    last = match.index! + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** The small part of Markdown that release notes use: headings, lists and paragraphs. */
export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.split("\n");
  let list: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (list.length) {
      const key = `ul-${blocks.length}`;
      blocks.push(
        <ul key={key}>
          {list.map((item, i) => (
            <li key={i}>{inline(item, `${key}-${i}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
    if (paragraph.length) {
      const key = `p-${blocks.length}`;
      blocks.push(<p key={key}>{inline(paragraph.join(" "), key)}</p>);
      paragraph = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const item = /^[-*]\s+(.*)$/.exec(line);
    if (!line) flush();
    else if (heading) {
      flush();
      blocks.push(<h2 key={`h-${blocks.length}`}>{inline(heading[2], `h-${blocks.length}`)}</h2>);
    } else if (item) {
      if (paragraph.length) flush();
      list.push(item[1]);
    } else {
      if (list.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return <>{blocks}</>;
}
