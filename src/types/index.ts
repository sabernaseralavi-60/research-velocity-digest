export interface RawPaper {
  id: string;
  title: string;
  publication_date: string;
  publication_year: number;
  primary_topic?: {
    id: string;
    display_name: string;
    subfield?: { display_name: string };
    field?: { display_name: string };
  };
  authorships?: Array<{
    author: { id: string; display_name: string };
    institutions?: Array<{ display_name: string }>;
  }>;
  referenced_works: string[];
  cited_by_count?: number;
  doi?: string;
  abstract?: string;
  abstract_inverted_index?: Record<string, number[]>;
}

export interface TrendingPaper {
  id: string;
  title: string;
  authors: string[];
  publication_year: number;
  primary_topic: string;
  subfield: string;
  recent_citation_velocity: number;
  all_time_citations: number;
  velocity_ratio_percent: number;
  scholar_url: string;
  openalex_url: string;
  doi_url?: string;
  abstract?: string;
  sample_citing_papers: Array<{ id: string; title: string }>;
}

export interface SleepingBeautyPaper {
  id: string;
  title: string;
  authors: string[];
  publication_year: number;
  dormancy_years: number;
  recent_citations: number;
  all_time_citations: number;
  awakening_score: number;
  scholar_url: string;
  openalex_url: string;
  primary_topic?: string;
  abstract?: string;
  sample_awakening_citers: Array<{ id: string; title: string }>;
}

export interface LatentGemPaper {
  id: string;
  title: string;
  authors: string[];
  publication_year: number;
  dormancy_years: number;
  all_time_citations: number;
  latent_potential_score: number;
  semantic_overlap_concept: string;
  why_valuable: string;
  scholar_url: string;
  openalex_url: string;
  primary_topic?: string;
  abstract?: string;
}

export interface PipelineStats {
  lookbackDays: number;
  startDate: string;
  endDate: string;
  recentPapersScanned: number;
  totalReferencesExtracted: number;
  uniqueWorksCited: number;
  trendingThreshold: number;
  trendingFoundCount: number;
  executionTimeMs: number;
  /** true when the numbers were computed earlier by the daily job (no run time to show) */
  precomputed?: boolean;
  thresholdFallback?: boolean;
}

export interface PipelineConfig {
  lookbackDays: number;
  minCitationVelocity: number;
  topN: number;
  subfields: string[];
  politeEmail: string;
}
