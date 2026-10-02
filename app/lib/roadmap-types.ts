// Public presentation contracts from the SakuraCord hub's /api/v2 API. GitHub
// Issues are canonical; the hub owns lifecycle, sync, and persistence.

export type IssueKind = "bug" | "feature";

export interface StatusOption {
  id: string;
  label: string;
  featureLabel: string;
  description: string;
  color: string;
  open: boolean;
  emoji: string;
}
export interface AreaOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
  color: string;
}
export interface PriorityOption {
  id: string;
  label: string;
  color: string;
  description: string;
}
export interface TrackerMeta {
  kinds: Array<{ id: IssueKind; label: string; plural: string }>;
  statuses: StatusOption[];
  areas: AreaOption[];
  priorities: PriorityOption[];
}

export interface TrackerIssue {
  number: number;
  title: string;
  kind: IssueKind;
  status: string;
  area: string | null;
  priority: string | null;
  summary: string | null;
  votes: number;
  milestone: string | null;
  shippedIn: string | null;
  duplicateOf: number | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  url: string;
  threadUrl: string | null;
}

export interface TrackerSnapshot {
  issues: TrackerIssue[];
  meta: TrackerMeta;
  etag: string;
}

export interface TimelineEntry {
  kind: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface IssueDetail extends TrackerIssue {
  labels: string[];
  reporter: { name: string; source: string } | null;
  sections: Array<{ heading: string; text: string }>;
  attachments: Array<{ name: string; url: string; image: boolean }>;
  fixes: Array<{
    kind: "pr" | "commit";
    number: number | null;
    sha: string | null;
    url: string;
    title: string | null;
    state: string;
  }>;
  shippedStableIn: string | null;
  timeline: TimelineEntry[];
  open: boolean;
}

export interface RoadmapVersion {
  number: number;
  version: string;
  headline: string;
  summary: string;
  highlights: Array<{ text: string; issues: number[] }>;
  state: "open" | "closed";
  dueOn: string | null;
  closedAt: string | null;
  openIssues: number;
  closedIssues: number;
  url: string | null;
}

export interface RoadmapData {
  versions: RoadmapVersion[];
  visible: number[];
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export interface FiledReport {
  number: number;
  threadId: string | null;
  issueUrl: string;
  threadUrl: string | null;
  trackerUrl: string;
}

export interface SimilarReport {
  number: number;
  title: string;
  kind: IssueKind | null;
  status: string;
  statusLabel: string;
  open: boolean;
  votes: number;
  url: string;
  trackerUrl: string;
  threadUrl: string | null;
  resolution: string | null;
}

export interface ReportField {
  id: string;
  label: string;
  heading: string;
  description?: string;
  placeholder?: string;
  kind: "short" | "paragraph" | "choice" | "version" | "area" | "files";
  required: boolean;
  maxLength?: number;
  options?: Array<{ value: string; label: string; description?: string }>;
  page: 1 | 2;
  diagnostic?: boolean;
}

export interface ReportFormDefinition {
  applicationId: string;
  versions: string[];
  kinds: Record<
    IssueKind,
    {
      kind: IssueKind;
      title: string;
      submitLabel: string;
      detailsLabel: string;
      titlePlaceholder: string;
      fields: ReportField[];
    }
  >;
  meta: TrackerMeta;
}

/** RPC surface of the hub Worker, reached through the ROADMAP service binding. */
export interface HubService {
  reportForm(): Promise<ReportFormDefinition>;
  similar(input: { text: string }): Promise<SimilarReport[]>;
  submit(input: {
    kind: IssueKind;
    values: Record<string, string>;
    files: Array<{ name: string; type?: string; data: ArrayBuffer }>;
    user: SessionUser;
  }): Promise<FiledReport>;
  meToo(input: {
    number: number;
    user: SessionUser;
    note?: string;
  }): Promise<FiledReport>;
  comment(input: {
    number: number;
    user: SessionUser;
    text: string;
  }): Promise<{ url: string }>;
}
