"use client";

/* eslint-disable @next/next/no-img-element -- Report media is served by the hub's attachment proxy. */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type {
  IssueDetail,
  TimelineEntry,
  TrackerIssue,
} from "../lib/roadmap-types";
import { statusLabel, useTracker } from "./tracker-context";
import { Morph, SFSymbol } from "../symbol";

export function TrackerDialog({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { closeItem, returnFocus } = useTracker();
  const closing = useRef(false);
  function close() {
    if (closing.current) return;
    closing.current = true;
    closeItem();
  }
  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousFocus = returnFocus.current ?? document.activeElement;
    const overflow = document.body.style.overflow;
    // The open attribute makes a direct link's server-rendered content visible.
    // Promote it to a modal after hydration for native focus trapping and Escape.
    dialog.close();
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  return (
    <dialog
      open
      ref={dialogRef}
      className="tracker-dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          close();
      }}
    >
      <div className="tracker-dialog-toolbar">
        <span>Tracker</span>
        <button type="button" autoFocus aria-label="Close item" onClick={close}>
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="tracker-dialog-content">{children}</div>
    </dialog>
  );
}

async function loadDetail(number: number): Promise<IssueDetail> {
  const response = await fetch(`/api/tracker/items/${number}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as IssueDetail;
}

function useDetail(number: number) {
  const { details } = useTracker();
  // Start empty on the server and in the browser alike. The item page seeds the cache while it
  // streams, after the server has already rendered this dialog, so reading it during render
  // made the browser's first render differ from the server's and broke hydration.
  const [detail, setDetail] = useState<IssueDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const cached = details.current.get(number);
    if (cached) queueMicrotask(() => !cancelled && setDetail(cached));
    loadDetail(number).then(
      (next) => {
        if (cancelled) return;
        details.current.set(number, next);
        setDetail(next);
        setFailed(false);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [number, version, details]);
  return { detail, failed, reload: () => setVersion((value) => value + 1) };
}

/** Links and bold text in comments, without rendering untrusted HTML. */
function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const pattern =
    /!?\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>()]+)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > last) parts.push(text.slice(last, match.index));
    const key = `${match.index}`;
    if (match[2])
      parts.push(
        <a key={key} href={match[2]} target="_blank" rel="noreferrer">
          {match[1] || match[2]}
        </a>,
      );
    else if (match[3])
      parts.push(
        <a key={key} href={match[3]} target="_blank" rel="noreferrer">
          {match[3]}
        </a>,
      );
    else if (match[4]) parts.push(<strong key={key}>{match[4]}</strong>);
    else if (match[5]) parts.push(<code key={key}>{match[5]}</code>);
    last = match.index! + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <p className="rich-text">{parts}</p>;
}

const SOURCE_LABEL: Record<string, string> = {
  discord: "Discord",
  github: "GitHub",
  website: "sakuracord.app",
};

// SF Symbols for each tracker area, in place of the hub's emoji.
const AREA_SYMBOLS: Record<string, string> = {
  chat: "bubble.left.fill",
  communication: "phone.fill",
  servers: "person.3.fill",
  personalization: "paintpalette.fill",
  plugins: "puzzlepiece.extension.fill",
  platform: "laptopcomputer",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TimelineItem({ entry, kind }: { entry: TimelineEntry; kind: string }) {
  const { meta } = useTracker();
  const data = entry.data as Record<string, string | number | boolean | null>;
  if (entry.kind === "comment") {
    const avatar = typeof data.avatarUrl === "string" ? data.avatarUrl : null;
    return (
      <li className="timeline-comment">
        {avatar ? (
          <img
            className="timeline-avatar"
            src={avatar}
            alt=""
            width={32}
            height={32}
          />
        ) : (
          <span className="timeline-avatar is-empty" aria-hidden="true">
            {data.agent ? <SFSymbol name="magnifyingglass" /> : String(data.author ?? "?").slice(0, 1)}
          </span>
        )}
        <div>
          <p className="timeline-meta">
            <strong>{String(data.author ?? "Someone")}</strong>
            <span className="source-badge">
              {data.agent
                ? "Investigation agent"
                : (SOURCE_LABEL[String(data.source)] ?? "GitHub")}
            </span>
            {typeof data.url === "string" ? (
              <a href={data.url} target="_blank" rel="noreferrer">
                {formatDate(entry.createdAt)}
              </a>
            ) : (
              <span>{formatDate(entry.createdAt)}</span>
            )}
          </p>
          <RichText text={String(data.body ?? "")} />
        </div>
      </li>
    );
  }
  let text: string | null = null;
  if (entry.kind === "created")
    text = data.migrated ? "Imported from the previous tracker" : "Reported";
  if (entry.kind === "status")
    text = `Moved to ${statusLabel(meta, String(data.to), kind)}`;
  if (entry.kind === "shipped") text = `Shipped in SakuraCord ${data.version}`;
  if (entry.kind === "merged")
    text = `#${data.from} was merged into this report`;
  if (entry.kind === "me-too")
    text = `${data.name} has the same ${kind === "feature" ? "request" : "problem"}`;
  if (entry.kind === "details") text = `${data.name} added details`;
  if (entry.kind === "fix")
    text = data.pr
      ? `Fix in progress in PR #${data.pr}`
      : `Fixed in commit ${String(data.sha ?? "").slice(0, 7)}`;
  if (!text) return null;
  return (
    <li className="timeline-event">
      <span className="status-dot" aria-hidden="true" />
      <span>{text}</span>
      <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
    </li>
  );
}

export function ItemDialog({ issue }: { issue: TrackerIssue }) {
  const { meta, session } = useTracker();
  const { detail, failed, reload } = useDetail(issue.number);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [comment, setComment] = useState("");
  const status = meta.statuses.find((option) => option.id === issue.status);
  const area = meta.areas.find((option) => option.id === issue.area);
  const priority = meta.priorities.find(
    (option) => option.id === issue.priority,
  );
  const signInHref = `/report/login?next=${encodeURIComponent(`/tracker/items/${issue.number}`)}`;
  const open = status?.open ?? true;

  async function post(path: string, body: object, success: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessage(success);
      reload();
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <TrackerDialog title={issue.title}>
      <div className="item-identity">
        <code>#{issue.number}</code>
        <a href={issue.url} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        {issue.threadUrl ? (
          <a href={issue.threadUrl} target="_blank" rel="noreferrer">
            Discord post ↗
          </a>
        ) : null}
      </div>
      <p className="item-status">
        <span
          className="status-dot"
          style={{ "--status-color": status?.color } as CSSProperties}
        />
        {statusLabel(meta, issue.status, issue.kind)}
        {status ? (
          <span className="item-status-note">· {status.description}</span>
        ) : null}
      </p>
      <h1>{issue.title}</h1>
      <dl className="item-facts">
        <div>
          <dt>Type</dt>
          <dd>{issue.kind === "feature" ? "Feature" : "Bug"}</dd>
        </div>
        {priority ? (
          <div>
            <dt>Priority</dt>
            <dd>
              <span className={`priority-marker priority-${priority.id}`} />
              {priority.label}
            </dd>
          </div>
        ) : null}
        {area ? (
          <div>
            <dt>Area</dt>
            <dd>
              <SFSymbol name={AREA_SYMBOLS[area.id] ?? "square.grid.2x2.fill"} className="sf-inline" />
              {area.label}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Votes</dt>
          <dd>
            <SFSymbol name="hand.thumbsup.fill" className="sf-inline" />
            {detail?.votes ?? issue.votes}
          </dd>
        </div>
        {issue.milestone ? (
          <div>
            <dt>Version</dt>
            <dd>v{issue.milestone}</dd>
          </div>
        ) : null}
        {detail?.reporter ? (
          <div>
            <dt>Reported by</dt>
            <dd className="is-plain">{detail.reporter.name}</dd>
          </div>
        ) : null}
      </dl>
      {open ? (
        <div className="item-actions">
          {session?.user ? (
            <button
              type="button"
              className="community-button"
              disabled={busy}
              onClick={() =>
                post(
                  "/api/report/me-too",
                  { number: issue.number },
                  "You're following this report and will be pinged in Discord when it ships.",
                )
              }
            >
              <Morph icon="hand.thumbsup.fill">Me too</Morph>
            </button>
          ) : session?.signInAvailable ? (
            <a className="community-button" href={signInHref}>
              <Morph icon="person.crop.circle.fill">Sign in with Discord to vote or comment</Morph>
            </a>
          ) : null}
          <span role="status" className="item-action-status">
            {message}
          </span>
        </div>
      ) : null}
      {detail ? (
        <>
          {detail.sections.map((section) => (
            <section className="item-section is-compact" key={section.heading}>
              <h2>{section.heading}</h2>
              <p className="item-description">{section.text}</p>
            </section>
          ))}
          {detail.attachments.length ? (
            <section className="item-section">
              <h2>Attachments</h2>
              <div className="item-gallery">
                {detail.attachments.map((attachment) =>
                  attachment.image ? (
                    <a
                      key={attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <a
                      key={attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {attachment.name} ↗
                    </a>
                  ),
                )}
              </div>
            </section>
          ) : null}
          {detail.fixes.length ? (
            <section className="item-section">
              <h2>Fixes</h2>
              <ul className="item-references">
                {detail.fixes.map((fix) => (
                  <li key={fix.url}>
                    <a href={fix.url} target="_blank" rel="noreferrer">
                      {fix.kind === "pr"
                        ? `PR #${fix.number}`
                        : `Commit ${fix.sha?.slice(0, 7)}`}
                      {fix.title ? ` · ${fix.title}` : ""} ↗
                    </a>
                    <p>
                      {fix.state === "merged"
                        ? "Merged"
                        : fix.state === "open"
                          ? "Open"
                          : "Closed"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="item-section">
            <h2>Activity</h2>
            <ol className="item-timeline">
              {detail.timeline.map((entry, index) => (
                <TimelineItem
                  key={`${entry.kind}-${entry.createdAt}-${index}`}
                  entry={entry}
                  kind={issue.kind}
                />
              ))}
            </ol>
            {open && session?.user ? (
              <form
                className="item-comment-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (
                    await post(
                      "/api/report/comment",
                      { number: issue.number, text: comment },
                      "Comment posted to GitHub and Discord.",
                    )
                  )
                    setComment("");
                }}
              >
                <label>
                  <span>Add a comment as {session.user.name}</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={3}
                    maxLength={6000}
                    placeholder="Share details, a workaround, or how it affects you…"
                  />
                </label>
                <button
                  type="submit"
                  className="community-button"
                  disabled={busy || !comment.trim()}
                >
                  Comment
                </button>
              </form>
            ) : null}
          </section>
        </>
      ) : failed ? (
        <div className="community-empty">
          <p>Details are temporarily unavailable.</p>
          <button className="community-retry" onClick={reload}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {issue.summary ? (
            <p className="item-description">{issue.summary}</p>
          ) : null}
          <p className="community-loading" role="status">
            Loading details…
          </p>
        </>
      )}
    </TrackerDialog>
  );
}
