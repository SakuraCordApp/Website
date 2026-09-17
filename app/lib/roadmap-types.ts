// Public presentation contracts from the Roadmap service's /api/v1 API.
// The service remains the owner of validation, lifecycle, and persistence.
export interface Option {
  id: string;
  label: string;
  color?: string;
}
export interface PublicConfig {
  areas: Option[];
  itemTypes: Option[];
  priorities: Option[];
  lifecycle: Option[];
  publicSections: Array<Option & { statuses: string[] }>;
}
export interface Reference {
  label: string;
  url?: string;
  value?: string;
}
export interface TrackerItem {
  id: string;
  title: string;
  description: string;
  type: string;
  area: string;
  status: string;
  priority: string;
  labels: string[];
  revision: number;
  acceptanceCriteria: Array<{
    id: string;
    statement: string;
    satisfied: boolean;
    evidence: Reference[];
  }>;
  references: Reference[];
  linkedDiscordThreads: Array<{ threadId: string; title: string; url: string }>;
}
export interface RoadmapVersion {
  id: string;
  version: string;
  title: string;
  state: string;
  position: number;
  highlights: Array<{ id: string; title: string }>;
}

export interface TrackerSnapshot {
  items: TrackerItem[];
  etag: string;
}
