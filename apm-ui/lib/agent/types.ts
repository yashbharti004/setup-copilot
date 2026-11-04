import { Guide } from "../schema/guide";

export interface PipelineProgressEvent {
  step:
    | "resolve"
    | "search_docs"
    | "fetch_pages"
    | "extract_schema"
    | "verify_claims"
    | "compute_rubric"
    | "complete"
    | "error";
  title: string;
  detail: string;
  timestamp: string;
  source_urls?: string[];
  downgrades_count?: number;
  guide?: Guide;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  retrieved_at: string;
}

export interface ResolvedAppInfo {
  canonical_name: string;
  slug: string;
  dev_domain: string;
  docs_url: string;
  logo_url: string;
  in_composio: boolean;
  category: string;
}

