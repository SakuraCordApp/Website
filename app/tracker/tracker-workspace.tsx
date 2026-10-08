"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type {
  IssueDetail,
  SessionUser,
  TrackerIssue,
  TrackerSnapshot,
} from "../lib/roadmap-types";
import { TrackerContext, statusLabel } from "./tracker-context";
import { ItemDialog } from "./item-dialog";
import ItemNotFound from "./items/[id]/not-found";
import { useTrackerNavigation } from "./use-tracker-navigation";
import { useTrackerSnapshot } from "./use-tracker-snapshot";
import { Morph, SFSymbol } from "../symbol";

const SHIPPED_WINDOW_DAYS = 60;

const COLUMNS = [
  { id: "review", label: "Under review", statuses: ["new", "needs_info"] },
  {
    id: "accepted",
    label: "Accepted",
    bugLabel: "Confirmed",
    statuses: ["confirmed"],
  },
  { id: "planned", label: "Planned", statuses: ["planned"] },
  {
    id: "progress",
    label: "In progress",
    statuses: ["in_progress", "in_nightly"],
  },
  { id: "shipped", label: "Recently shipped", statuses: ["shipped", "done"] },
];

const SORTS = {
  votes: (a: TrackerIssue, b: TrackerIssue) =>
    b.votes - a.votes || b.updatedAt.localeCompare(a.updatedAt),
  newest: (a: TrackerIssue, b: TrackerIssue) => b.number - a.number,
  updated: (a: TrackerIssue, b: TrackerIssue) =>
    b.updatedAt.localeCompare(a.updatedAt),
};

const LANE_PREVIEW = 5;

export function TrackerWorkspace({
  snapshot,
  children,
}: {
  snapshot: TrackerSnapshot;
  children?: ReactNode;
}) {
  const params = useSearchParams();
  const { issues, meta } = useTrackerSnapshot(snapshot);
  const { itemId, openItem, closeItem, returnFocus } = useTrackerNavigation();
  const details = useRef(new Map<number, IssueDetail>());
  const [session, setSession] = useState<{
    user: SessionUser | null;
    signInAvailable: boolean;
  } | null>(null);
  useEffect(() => {
    fetch("/api/report/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) =>
        setSession(
          value as {
            user: SessionUser | null;
            signInAvailable: boolean;
          } | null,
        ),
      )
      .catch(() => setSession(null));
  }, []);
  const byNumber = useMemo(
    () => new Map(issues.map((issue) => [issue.number, issue])),
    [issues],
  );
  const selectedNumber = itemId && /^\d+$/.test(itemId) ? Number(itemId) : null;
  const selected = selectedNumber ? byNumber.get(selectedNumber) : undefined;
  useEffect(() => {
    document.title = selected
      ? `${selected.title} · SakuraCord Tracker`
      : "Tracker · SakuraCord";
  }, [selected]);

  const search = params.get("search") ?? "";
  const priority = params.get("priority") ?? "";
  const kind = params.get("kind") ?? "";
  const area = params.get("area") ?? "";
  const status = params.get("status") ?? "";
  const sort = (params.get("sort") ?? "votes") as keyof typeof SORTS;
  const deferredSearch = useDeferredValue(search);
  const closedStatus = meta.statuses.find(
    (option) => option.id === status && !option.open,
  );
  // Categories fold away and long lanes show a preview, so the board stays short.
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const [openLanes, setOpenLanes] = useState<Record<string, boolean>>({});
  const [shippedCutoff] = useState(
    () => Date.now() - SHIPPED_WINDOW_DAYS * 86_400_000,
  );
  const filtered = useMemo(
    () =>
      issues
        .filter((issue) => {
          if (priority && issue.priority !== priority) return false;
          if (kind && issue.kind !== kind) return false;
          if (area && issue.area !== area) return false;
          if (status && issue.status !== status) return false;
          const query = deferredSearch.trim().toLocaleLowerCase();
          return (
            !query ||
            `#${issue.number} ${issue.title} ${issue.summary ?? ""}`
              .toLocaleLowerCase()
              .includes(query)
          );
        })
        .sort(SORTS[sort] ?? SORTS.votes),
    [issues, priority, kind, area, status, deferredSearch, sort],
  );
  const columns = closedStatus
    ? [
        {
          id: closedStatus.id,
          label: closedStatus.label,
          statuses: [closedStatus.id],
        },
      ]
    : COLUMNS.filter((column) => !status || column.statuses.includes(status));
  const inColumn = (issue: TrackerIssue, statuses: string[]) =>
    statuses.includes(issue.status) &&
    (closedStatus ||
      !["shipped", "done"].includes(issue.status) ||
      Date.parse(issue.closedAt ?? issue.updatedAt) >= shippedCutoff);
  const visibleCount = filtered.filter((issue) =>
    columns.some((column) => inColumn(issue, column.statuses)),
  ).length;
  const hasFilters = Boolean(search || priority || kind || area || status);
  const query = params.toString();

  function updateFilter(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    const suffix = next.size ? `?${next}` : "";
    window.history.replaceState(window.history.state, "", `/tracker${suffix}`);
  }
  function clearFilters() {
    window.history.replaceState(window.history.state, "", "/tracker");
  }

  return (
    <TrackerContext
      value={{
        meta,
        issues: byNumber,
        closeItem,
        returnFocus,
        details,
        session,
      }}
    >
      <header className="community-heading">
        <div>
          <h1>Tracker</h1>
          <p>
            Every SakuraCord bug and suggestion, synced with Discord and GitHub.
          </p>
        </div>
        <div className="community-heading-actions">
          <Link className="community-button" href="/report?type=bug">
            <Morph icon="ladybug.fill">Report a bug</Morph>
          </Link>
          <Link
            className="community-button is-secondary"
            href="/report?type=feature"
          >
            <Morph icon="lightbulb.fill">Suggest a feature</Morph>
          </Link>
        </div>
      </header>
      <form
        className="tracker-filters"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="tracker-search">
          <span className="sr-only">Search</span>
          <SFSymbol name="magnifyingglass" />
          <input
            type="search"
            name="search"
            placeholder="Search by title or #number…"
            autoComplete="off"
            value={search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Type</span>
          <select
            value={kind}
            onChange={(event) => updateFilter("kind", event.target.value)}
          >
            <option value="">Bugs & features</option>
            {meta.kinds.map((option) => (
              <option key={option.id} value={option.id}>
                {option.plural}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Area</span>
          <select
            value={area}
            onChange={(event) => updateFilter("area", event.target.value)}
          >
            <option value="">All areas</option>
            {meta.areas.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Priority</span>
          <select
            value={priority}
            onChange={(event) => updateFilter("priority", event.target.value)}
          >
            <option value="">All priorities</option>
            {meta.priorities.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select
            value={status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="">Active & recently shipped</option>
            {meta.statuses.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select
            value={sort}
            onChange={(event) => updateFilter("sort", event.target.value)}
          >
            <option value="votes">Most votes</option>
            <option value="newest">Newest</option>
            <option value="updated">Recently updated</option>
          </select>
        </label>
      </form>
      <div className="tracker-results">
        <p aria-live="polite">
          {visibleCount} {visibleCount === 1 ? "report" : "reports"}
        </p>
        {hasFilters ? (
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>
      <div id="browse" className="tracker-board">
        {meta.kinds.map((type) => {
          const group = filtered.filter((issue) => issue.kind === type.id);
          if (!group.length) return null;
          return (
            <section
              className="tracker-category"
              key={type.id}
              aria-labelledby={`category-${type.id}`}
            >
              <h2 id={`category-${type.id}`}>
                <button
                  type="button"
                  className="tracker-fold"
                  aria-expanded={!folded[type.id]}
                  aria-controls={`board-${type.id}`}
                  onClick={() =>
                    setFolded((current) => ({
                      ...current,
                      [type.id]: !current[type.id],
                    }))
                  }
                >
                  {type.plural}
                  <SFSymbol name="chevron.down" className="tracker-fold-chevron" />
                </button>
                <span>{group.length}</span>
              </h2>
              <div
                className="tracker-collapse"
                id={`board-${type.id}`}
                data-open={!folded[type.id]}
                inert={folded[type.id] || undefined}
              >
              <div
                className="tracker-columns"
                style={{ "--columns": columns.length } as CSSProperties}
              >
                {columns.map((column) => {
                  const lane = group.filter((issue) =>
                    inColumn(issue, column.statuses),
                  );
                  const color = meta.statuses.find(
                    (option) => option.id === column.statuses[0],
                  )?.color;
                  const renderCard = (issue: (typeof lane)[number]) => (

                          <a
                            className="tracker-card"
                            key={issue.number}
                            href={`/tracker/items/${issue.number}${query ? `?${query}` : ""}`}
                            onClick={openItem}
                            aria-label={`#${issue.number} ${issue.title}, ${statusLabel(meta, issue.status, issue.kind)}, ${issue.votes} votes`}
                          >
                            <span
                              className={`priority-marker priority-${issue.priority ?? "medium"}`}
                              aria-hidden="true"
                            />
                            <span>
                              {issue.title}
                              <small className="tracker-card-meta">
                                #{issue.number}
                                {issue.votes ? (
                                  <>
                                    {" · "}
                                    <SFSymbol name="hand.thumbsup.fill" className="sf-inline" />{" "}
                                    {issue.votes}
                                  </>
                                ) : null}
                                {issue.status === "in_nightly"
                                  ? " · In nightly"
                                  : ""}
                                {issue.status === "needs_info"
                                  ? " · Needs info"
                                  : ""}
                                {issue.milestone && column.id !== "shipped"
                                  ? ` · v${issue.milestone}`
                                  : ""}
                                {issue.shippedIn && column.id === "shipped"
                                  ? ` · ${issue.shippedIn}`
                                  : ""}
                              </small>
                            </span>
                          </a>
                  );
                  return (
                    <section
                      className="tracker-column"
                      key={column.id}
                      aria-labelledby={`${type.id}-${column.id}`}
                    >
                      <h3
                        id={`${type.id}-${column.id}`}
                        style={{ "--status-color": color } as CSSProperties}
                      >
                        {type.id === "bug" && "bugLabel" in column
                          ? column.bugLabel
                          : column.label}
                        <span className="column-count">{lane.length}</span>
                      </h3>
                      <div className="tracker-lane-items">
                        {lane.slice(0, LANE_PREVIEW).map(renderCard)}
                        {lane.length > LANE_PREVIEW ? (
                          <>
                            <div
                              className="tracker-collapse"
                              id={`lane-${type.id}-${column.id}`}
                              data-open={Boolean(openLanes[`${type.id}-${column.id}`])}
                              inert={!openLanes[`${type.id}-${column.id}`] || undefined}
                            >
                              <div className="tracker-lane-more">
                                {lane.slice(LANE_PREVIEW).map(renderCard)}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="tracker-lane-toggle"
                              aria-expanded={Boolean(openLanes[`${type.id}-${column.id}`])}
                              aria-controls={`lane-${type.id}-${column.id}`}
                              onClick={() =>
                                setOpenLanes((current) => ({
                                  ...current,
                                  [`${type.id}-${column.id}`]: !current[`${type.id}-${column.id}`],
                                }))
                              }
                            >
                              {openLanes[`${type.id}-${column.id}`]
                                ? "Show less"
                                : `Show ${lane.length - LANE_PREVIEW} more`}
                              <SFSymbol name="chevron.down" className="tracker-fold-chevron" />
                            </button>
                          </>
                        ) : null}
                        {!lane.length ? (
                          <p className="tracker-empty-lane">Nothing here.</p>
                        ) : null}
                      </div>
                    </section>
                  );
                })}
              </div>
              </div>
            </section>
          );
        })}
        {!visibleCount ? (
          <div className="community-empty">
            <h2>{hasFilters ? "No reports match" : "No reports yet"}</h2>
            <p>
              {hasFilters
                ? "Try another search or clear the filters."
                : "Reports will appear here."}
            </p>
          </div>
        ) : null}
      </div>
      {children}
      {itemId ? (
        selected ? (
          <ItemDialog key={itemId} issue={selected} />
        ) : (
          <ItemNotFound />
        )
      ) : null}
    </TrackerContext>
  );
}
