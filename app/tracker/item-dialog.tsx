"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import type { Reference, TrackerItem } from "../lib/roadmap-types";
import { useTracker } from "./tracker-context";

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

export function ItemDialog({ item }: { item: TrackerItem }) {
  const { config } = useTracker();
  const [copyStatus, setCopyStatus] = useState("");
  const status = config.lifecycle.find((option) => option.id === item.status);
  const references = [...item.references];
  for (const thread of item.linkedDiscordThreads) {
    if (!references.some((reference) => reference.url === thread.url))
      references.push({
        label: thread.title || "Discord report",
        url: thread.url,
      });
  }
  return (
    <TrackerDialog title={item.title}>
      <div className="item-identity">
        <code>{item.id}</code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(item.id);
              setCopyStatus("ID copied");
            } catch {
              setCopyStatus("Select the ID to copy it.");
            }
          }}
        >
          Copy ID
        </button>
        <span role="status">{copyStatus}</span>
      </div>
      <p className="item-status">
        <span
          className="status-dot"
          style={{ "--status-color": status?.color } as CSSProperties}
        />
        {status?.label ?? item.status}
      </p>
      <h1>{item.title}</h1>
      <dl className="item-facts">
        <div>
          <dt>Priority</dt>
          <dd>
            <span className={`priority-marker priority-${item.priority}`} />
            {config.priorities.find((option) => option.id === item.priority)
              ?.label ?? item.priority}
          </dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>
            {config.itemTypes.find((option) => option.id === item.type)
              ?.label ?? item.type}
          </dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>
            {config.areas.find((option) => option.id === item.area)?.label ??
              item.area}
          </dd>
        </div>
        {item.labels.length ? (
          <div>
            <dt>Type</dt>
            <dd>
              {item.labels
                .map((label) => label.replaceAll("_", " "))
                .join(", ")}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="item-description">{item.description}</p>
      {item.acceptanceCriteria.length ? (
        <section className="item-section">
          <h2>Acceptance criteria</h2>
          <ul className="item-criteria">
            {item.acceptanceCriteria.map((criterion) => (
              <li key={criterion.id}>
                <span
                  className={
                    criterion.satisfied
                      ? "criterion-check is-satisfied"
                      : "criterion-check"
                  }
                  aria-label={
                    criterion.satisfied ? "Satisfied" : "Not yet satisfied"
                  }
                >
                  {criterion.satisfied ? "✓" : "○"}
                </span>
                <div>
                  <p>{criterion.statement}</p>
                  <References references={criterion.evidence} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {references.length ? (
        <section className="item-section">
          <h2>Report sources</h2>
          <References references={references} />
        </section>
      ) : null}
    </TrackerDialog>
  );
}
function References({ references }: { references: Reference[] }) {
  if (!references.length) return null;
  return (
    <ul className="item-references">
      {references.map((reference, index) => (
        <li key={`${reference.url ?? reference.label}-${index}`}>
          {reference.url && /^https?:\/\//i.test(reference.url) ? (
            <a href={reference.url} target="_blank" rel="noreferrer">
              {reference.label} <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span>{reference.label}</span>
          )}
          {reference.value ? <p>{reference.value}</p> : null}
        </li>
      ))}
    </ul>
  );
}
