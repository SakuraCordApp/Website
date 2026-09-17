"use client";

/* eslint-disable @next/next/no-img-element -- Reuse the original local priority SVGs. */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  type CSSProperties,
} from "react";
import type { PublicConfig, TrackerSnapshot } from "../lib/roadmap-types";
import { TrackerContext } from "./tracker-context";
import { ItemDialog } from "./item-dialog";
import ItemNotFound from "./items/[id]/not-found";
import { useTrackerNavigation } from "./use-tracker-navigation";
import { useTrackerSnapshot } from "./use-tracker-snapshot";

export function TrackerWorkspace({
  config,
  snapshot,
}: {
  config: PublicConfig;
  snapshot: TrackerSnapshot;
}) {
  const params = useSearchParams();
  const { items } = useTrackerSnapshot(snapshot);
  const { itemId, openItem, closeItem, returnFocus } = useTrackerNavigation();
  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );
  const selectedItem = itemId ? itemsById.get(itemId) : undefined;
  useEffect(() => {
    document.title = selectedItem
      ? `${selectedItem.title} · SakuraCord Tracker`
      : "Tracker · SakuraCord";
  }, [selectedItem]);
  const search = params.get("search") ?? "";
  const priority = params.get("priority") ?? "";
  const kind = params.get("kind") ?? "";
  const status = params.get("status") ?? "";
  const deferredSearch = useDeferredValue(search);
  const visibleStatuses = useMemo(
    () => new Set(config.publicSections.flatMap((section) => section.statuses)),
    [config.publicSections],
  );
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (!visibleStatuses.has(item.status)) return false;
        if (priority && item.priority !== priority) return false;
        if (kind && item.type !== kind) return false;
        if (status && item.status !== status) return false;
        const query = deferredSearch.trim().toLocaleLowerCase();
        return (
          !query ||
          `${item.id} ${item.title} ${item.description}`
            .toLocaleLowerCase()
            .includes(query)
        );
      }),
    [items, visibleStatuses, priority, kind, status, deferredSearch],
  );
  const hasFilters = Boolean(search || priority || kind || status);
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
    <TrackerContext value={{ config, closeItem, returnFocus }}>
      <header className="community-heading">
        <div>
          <h1>Tracker</h1>
          <p>Features, fixes, and community reports.</p>
        </div>
        <Link className="community-text-link" href="/roadmap">
          View the roadmap <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <form
        className="tracker-filters"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="tracker-search">
          <span>Search changes</span>
          <input
            type="search"
            name="search"
            placeholder="Search the tracker…"
            autoComplete="off"
            value={search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </label>
        <label>
          <span>Priority</span>
          <select
            value={priority}
            onChange={(event) => updateFilter("priority", event.target.value)}
          >
            <option value="">All priorities</option>
            {config.priorities.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Category</span>
          <select
            value={kind}
            onChange={(event) => updateFilter("kind", event.target.value)}
          >
            <option value="">All categories</option>
            {config.itemTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="">All statuses</option>
            {config.lifecycle
              .filter((option) => visibleStatuses.has(option.id))
              .map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
          </select>
        </label>
      </form>
      <div className="tracker-results">
        <p aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "change" : "changes"}
        </p>
        {hasFilters ? (
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>
      <div id="browse" className="tracker-board">
        {config.itemTypes.map((type) => {
          const group = filtered.filter((item) => item.type === type.id);
          if (!group.length) return null;
          return (
            <section
              className="tracker-category"
              key={type.id}
              aria-labelledby={`category-${type.id}`}
            >
              <h2 id={`category-${type.id}`}>
                {type.id === "feature"
                  ? "Features"
                  : type.id === "bug"
                    ? "Bugs"
                    : type.label}
                <span>{group.length}</span>
              </h2>
              <div className="tracker-columns">
                {config.publicSections
                  .filter(
                    (section) => !status || section.statuses.includes(status),
                  )
                  .map((section) => (
                    <section
                      className="tracker-column"
                      key={section.id}
                      aria-labelledby={`${type.id}-${section.id}`}
                    >
                      <h3
                        id={`${type.id}-${section.id}`}
                        style={
                          {
                            "--status-color": config.lifecycle.find((option) =>
                              section.statuses.includes(option.id),
                            )?.color,
                          } as CSSProperties
                        }
                      >
                        {section.label}
                        <span className="column-count">
                          {
                            group.filter((item) =>
                              section.statuses.includes(item.status),
                            ).length
                          }
                        </span>
                      </h3>
                      <div className="tracker-lane-items">
                        {group
                          .filter((item) =>
                            section.statuses.includes(item.status),
                          )
                          .map((item) => (
                            <a
                              className="tracker-card"
                              key={item.id}
                              href={`/tracker/items/${encodeURIComponent(item.id)}${query ? `?${query}` : ""}`}
                              onClick={openItem}
                              aria-label={`${item.title}, ${config.priorities.find((option) => option.id === item.priority)?.label ?? item.priority} priority`}
                            >
                              <img
                                className="tracker-priority-icon"
                                src={`/brand/priority/${item.priority}.svg`}
                                width={64}
                                height={64}
                                loading="lazy"
                                alt=""
                                title={`${config.priorities.find((option) => option.id === item.priority)?.label ?? item.priority} priority`}
                              />
                              <span>{item.title}</span>
                            </a>
                          ))}
                        {!group.some((item) =>
                          section.statuses.includes(item.status),
                        ) ? (
                          <p className="tracker-empty-lane">No changes here.</p>
                        ) : null}
                      </div>
                    </section>
                  ))}
              </div>
            </section>
          );
        })}
        {!filtered.length ? (
          <div className="community-empty">
            <h2>{hasFilters ? "No changes match" : "No changes yet"}</h2>
            <p>
              {hasFilters
                ? "Try another search or clear the filters."
                : "Published changes will appear here."}
            </p>
          </div>
        ) : null}
      </div>
      {itemId ? (
        selectedItem ? (
          <ItemDialog key={itemId} item={selectedItem} />
        ) : (
          <ItemNotFound />
        )
      ) : null}
    </TrackerContext>
  );
}
