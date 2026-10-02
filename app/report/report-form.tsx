"use client";

/* eslint-disable @next/next/no-img-element -- Discord avatars are remote. */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  FiledReport,
  IssueKind,
  ReportField,
  ReportFormDefinition,
  SessionUser,
  SimilarReport,
} from "../lib/roadmap-types";

const DRAFT_KEY = "sakuracord-report-draft";
const FROM_SOURCE = "Built from source";
const UNKNOWN = "Other / not sure";

type Session = { user: SessionUser | null; signInAvailable: boolean };
type Outcome = { report: FiledReport; existing: boolean };

export function ReportForm() {
  const params = useSearchParams();
  const [form, setForm] = useState<Omit<
    ReportFormDefinition,
    "applicationId"
  > | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [kind, setKind] = useState<IssueKind>(
    params.get("type") === "feature" ? "feature" : "bug",
  );
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const key of ["title", "version", "macos", "mac", "area"]) {
      const value = params.get(key);
      if (value) initial[key] = value.slice(0, 200);
    }
    return initial;
  });
  const prefilled = useMemo(
    () => new Set(["version", "macos", "mac"].filter((key) => params.get(key))),
    [params],
  );
  const [files, setFiles] = useState<File[]>([]);
  const [similar, setSimilar] = useState<SimilarReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/report/form").then((response) =>
        response.ok ? response.json() : Promise.reject(),
      ),
      fetch("/api/report/session", { cache: "no-store" }).then((response) =>
        response.json(),
      ),
    ])
      .then(([definition, currentSession]) => {
        setForm(definition as Omit<ReportFormDefinition, "applicationId">);
        setSession(currentSession as Session);
      })
      .catch(() => setLoadError(true));
  }, []);

  const definition = form?.kinds[kind];
  const mainField = kind === "bug" ? "what_happened" : "request";
  const searchText = `${values.title ?? ""}\n${values[mainField] ?? ""}`.trim();

  useEffect(() => {
    if (searchText.length < 12) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/report/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: searchText }),
          signal: controller.signal,
        });
        if (response.ok)
          setSimilar(
            ((await response.json()) as { results: SimilarReport[] }).results,
          );
      } catch {
        /* the check is a convenience */
      }
    }, 700);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchText]);

  const visibleSimilar = searchText.length >= 12 ? similar : [];

  function update(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  function signIn() {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ kind, values }));
    const next = `/report?${new URLSearchParams({ type: kind })}`;
    window.location.assign(`/report/login?next=${encodeURIComponent(next)}`);
  }

  async function meToo(number: number) {
    if (!session?.user) return signIn();
    setBusy(true);
    setError("");
    try {
      const note = [values[mainField], values.steps]
        .filter(Boolean)
        .join("\n\n");
      const response = await fetch("/api/report/me-too", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, note }),
      });
      const data = (await response.json()) as FiledReport & { error?: string };
      if (!response.ok) throw new Error(data.error);
      setOutcome({ report: data, existing: true });
    } catch (failure) {
      setError(
        failure instanceof Error && failure.message
          ? failure.message
          : "That didn't work. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return signIn();
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("kind", kind);
      body.set("values", JSON.stringify(values));
      for (const file of files.slice(0, 5)) body.append("files", file);
      const response = await fetch("/api/report/submit", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as FiledReport & { error?: string };
      if (!response.ok) throw new Error(data.error);
      setOutcome({ report: data, existing: false });
      window.scrollTo({ top: 0 });
    } catch (failure) {
      setError(
        failure instanceof Error && failure.message
          ? failure.message
          : "That didn't work. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (outcome) {
    return (
      <section className="report-done">
        <h1>
          {outcome.existing
            ? `You're following #${outcome.report.number}`
            : `Filed as #${outcome.report.number}`}
        </h1>
        <p>
          {outcome.existing
            ? "We added your details to the existing report. You'll be pinged in Discord when it changes."
            : "Thank you! Your report has a Discord post and a GitHub issue. You'll be pinged in Discord when it's confirmed, fixed, and shipped."}
        </p>
        <div className="report-links">
          {outcome.report.threadUrl ? (
            <a className="community-button" href={outcome.report.threadUrl}>
              Open the Discord post
            </a>
          ) : null}
          <Link
            className="community-button is-secondary"
            href={`/tracker/items/${outcome.report.number}`}
          >
            View on the tracker
          </Link>
          <a className="community-text-link" href={outcome.report.issueUrl}>
            GitHub issue ↗
          </a>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <div className="community-empty">
        <h1>Reporting is temporarily unavailable</h1>
        <p>
          You can still use /bug or /suggest in the SakuraCord Discord server.
        </p>
      </div>
    );
  }
  if (!form || !definition || !session)
    return <p className="community-loading">Loading…</p>;

  const pages = [1, 2] as const;
  return (
    <form className="report-form" onSubmit={submit}>
      <header className="community-heading">
        <div>
          <h1>{definition.title}</h1>
          <p>
            Every report is public on GitHub and the tracker, and gets its own
            post in our Discord.
          </p>
        </div>
      </header>

      <div className="report-kind" role="radiogroup" aria-label="Report type">
        {(["bug", "feature"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={kind === option}
            className={kind === option ? "is-selected" : ""}
            onClick={() => setKind(option)}
          >
            {option === "bug" ? "🐞 Bug" : "✨ Feature"}
          </button>
        ))}
      </div>

      <div className="report-account">
        {session.user ? (
          <>
            {session.user.avatarUrl ? (
              <img src={session.user.avatarUrl} alt="" width={28} height={28} />
            ) : null}
            <span>
              Reporting as <strong>{session.user.name}</strong>
            </span>
            <a
              href={`/report/logout?next=${encodeURIComponent(`/report?type=${kind}`)}`}
            >
              Sign out
            </a>
          </>
        ) : (
          <span>
            You&apos;ll sign in with Discord when you submit, so we can ping you
            with updates.
          </span>
        )}
      </div>

      <label className="report-field">
        <span>Title</span>
        <input
          value={values.title ?? ""}
          onChange={(event) => update("title", event.target.value)}
          required
          minLength={4}
          maxLength={100}
          placeholder={definition.titlePlaceholder}
        />
      </label>

      {pages.map((page) => (
        <fieldset key={page} className="report-page">
          {page === 2 ? (
            <legend>
              {definition.detailsLabel} <small>optional</small>
            </legend>
          ) : null}
          {definition.fields
            .filter((field) => field.page === page)
            .map((field) => (
              <Field
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                versions={form.versions}
                prefilled={prefilled.has(field.id)}
                onChange={(value) => update(field.id, value)}
                files={files}
                onFiles={setFiles}
              />
            ))}
          {page === 1 && visibleSimilar.length ? (
            <aside className="report-similar" aria-live="polite">
              <h2>Already reported?</h2>
              <p>
                If one of these is the same, add yourself to it — you&apos;ll get the
                same updates.
              </p>
              <ul>
                {visibleSimilar.map((report) => (
                  <li key={report.number}>
                    <div>
                      <a
                        href={`/tracker/items/${report.number}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        #{report.number} · {report.title}
                      </a>
                      <small>
                        {report.statusLabel}
                        {report.votes ? ` · 👍 ${report.votes}` : ""}
                      </small>
                    </div>
                    {report.open ? (
                      <button
                        type="button"
                        className="community-button is-secondary"
                        disabled={busy}
                        onClick={() => meToo(report.number)}
                      >
                        That&apos;s my issue
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </fieldset>
      ))}

      {error ? (
        <p className="report-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="report-submit">
        <button type="submit" className="community-button" disabled={busy}>
          {busy
            ? "Sending…"
            : session.user
              ? definition.submitLabel
              : "Sign in with Discord & continue"}
        </button>
      </div>
    </form>
  );
}

function Field({
  field,
  value,
  versions,
  prefilled,
  onChange,
  files,
  onFiles,
}: {
  field: ReportField;
  value: string;
  versions: string[];
  prefilled: boolean;
  onChange: (value: string) => void;
  files: File[];
  onFiles: (files: File[]) => void;
}) {
  const hint = prefilled ? "Filled in by SakuraCord" : field.description;
  if (field.kind === "choice") {
    return (
      <fieldset className="report-field report-choice">
        <legend>
          {field.label}
          {field.required ? "" : <small> optional</small>}
        </legend>
        {field.options!.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={field.id}
              value={option.value}
              checked={value === option.value}
              required={field.required}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    );
  }
  if (field.kind === "files") {
    return (
      <label className="report-field">
        <span>
          {field.label} <small>optional</small>
        </span>
        <input
          type="file"
          accept="image/*,video/*,.txt,.log,.json"
          multiple
          onChange={(event) =>
            onFiles([...(event.target.files ?? [])].slice(0, 5))
          }
        />
        <small>
          {files.length ? `${files.length} selected · ` : ""}Up to 5 files, 10
          MB each.
        </small>
      </label>
    );
  }
  if (field.kind === "version" || field.kind === "area") {
    const options =
      field.kind === "area"
        ? field.options!.map((option) => ({
            value: option.value,
            label: option.label,
          }))
        : [
            ...new Set([
              ...(value ? [value] : []),
              ...versions,
              FROM_SOURCE,
              UNKNOWN,
            ]),
          ].map((version) => ({
            value: version,
            label: version,
          }));
    return (
      <label className="report-field">
        <span>
          {field.label}
          {field.required ? "" : <small> optional</small>}
        </span>
        <select
          value={value}
          required={field.required}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">
            {field.kind === "area" ? "Not sure" : "Choose a version"}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint ? <small>{hint}</small> : null}
      </label>
    );
  }
  const common = {
    value,
    required: field.required,
    maxLength: field.maxLength,
    placeholder: field.placeholder,
    onChange: (event: { target: { value: string } }) =>
      onChange(event.target.value),
  };
  return (
    <label className="report-field">
      <span>
        {field.label}
        {field.required ? "" : <small> optional</small>}
      </span>
      {field.kind === "paragraph" ? (
        <textarea rows={5} {...common} />
      ) : (
        <input {...common} />
      )}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
