import { RawPaper, TrendingPaper, PipelineStats } from '../types/index.ts';
import { generateScholarUrl, reconstructAbstract } from '../utils/scholar.ts';

export interface CitationCountRecord {
  workId: string;
  velocityCount: number;
  citingPapers: Array<{ id: string; title: string }>;
}

/**
 * Core Inverted Index Reference Frequency Analyzer.
 * Instead of checking millions of historical papers, we invert the references
 * of the latest batch of newly published papers:
 *
 * Recent Papers (Batch) -> Extract referenced_works -> Inverted Map: Cited ID -> count
 */
export function buildInvertedReferenceIndex(
  recentPapers: RawPaper[],
  minVelocityThreshold: number = 5
): {
  referenceCounts: Map<string, number>;
  citingMap: Map<string, Array<{ id: string; title: string }>>;
  filteredWorkIds: string[];
  totalReferencesCount: number;
} {
  const referenceCounts = new Map<string, number>();
  const citingMap = new Map<string, Array<{ id: string; title: string }>>();
  let totalReferencesCount = 0;

  for (const paper of recentPapers) {
    if (!paper.referenced_works || !Array.isArray(paper.referenced_works)) {
      continue;
    }

    // De-duplicate referenced_works per citing paper to prevent self-duplication skew
    const uniqueRefs = new Set(paper.referenced_works);
    totalReferencesCount += uniqueRefs.size;

    for (const refId of uniqueRefs) {
      if (!refId) continue;
      const currentCount = referenceCounts.get(refId) || 0;
      referenceCounts.set(refId, currentCount + 1);

      // Track up to 5 citing papers for citation context
      let citingList = citingMap.get(refId);
      if (!citingList) {
        citingList = [];
        citingMap.set(refId, citingList);
      }
      if (citingList.length < 5) {
        citingList.push({
          id: paper.id,
          title: paper.title || 'Untitled Work',
        });
      }
    }
  }

  // Filter keys meeting the threshold
  const filteredWorkIds = Array.from(referenceCounts.entries())
    .filter(([_, count]) => count >= minVelocityThreshold)
    .sort((a, b) => b[1] - a[1])
    .map(([workId]) => workId);

  return {
    referenceCounts,
    citingMap,
    filteredWorkIds,
    totalReferencesCount,
  };
}

/**
 * Hydrates hydrated paper details with calculated velocity statistics and Google Scholar links.
 */
export function compileTrendingPapers(
  hydratedPapers: RawPaper[],
  referenceCounts: Map<string, number>,
  citingMap: Map<string, Array<{ id: string; title: string }>>,
  topN: number = 15
): TrendingPaper[] {
  const results: TrendingPaper[] = [];

  for (const paper of hydratedPapers) {
    // Normalize OpenAlex work ID: could be "https://openalex.org/W12345" or "W12345"
    const rawId = paper.id;
    const velocity = referenceCounts.get(rawId) || 0;
    const allTimeCitations = paper.cited_by_count ?? velocity;
    const velocityRatio = allTimeCitations > 0 
      ? Math.min(100, Math.round((velocity / allTimeCitations) * 100))
      : 100;

    const authorNames = (paper.authorships || [])
      .map(a => a.author?.display_name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 5);

    const firstAuthor = authorNames[0];
    const scholarUrl = generateScholarUrl(paper.title, firstAuthor, paper.publication_year);
    const abstract = paper.abstract || reconstructAbstract(paper.abstract_inverted_index);

    results.push({
      id: rawId,
      title: paper.title || 'Untitled Research Work',
      authors: authorNames.length > 0 ? authorNames : ['Anonymous / Unknown'],
      publication_year: paper.publication_year || new Date().getFullYear(),
      primary_topic: paper.primary_topic?.display_name || 'Artificial Intelligence',
      subfield: paper.primary_topic?.subfield?.display_name || 'Computer Science',
      recent_citation_velocity: velocity,
      all_time_citations: allTimeCitations,
      velocity_ratio_percent: velocityRatio,
      scholar_url: scholarUrl,
      openalex_url: rawId.startsWith('http') ? rawId : `https://openalex.org/${rawId}`,
      doi_url: paper.doi ? (paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`) : undefined,
      abstract: abstract ? (abstract.length > 320 ? abstract.substring(0, 317) + '...' : abstract) : undefined,
      sample_citing_papers: citingMap.get(rawId) || [],
    });
  }

  // Sort descending by recent_citation_velocity
  results.sort((a, b) => b.recent_citation_velocity - a.recent_citation_velocity);
  return results.slice(0, topN);
}

/**
 * Computes pipeline summary stats for logging and UI dashboard
 */
export function calculatePipelineStats(
  recentPapersCount: number,
  totalReferencesCount: number,
  uniqueWorksCited: number,
  trendingFoundCount: number,
  lookbackDays: number,
  minThreshold: number,
  startTimeMs: number
): PipelineStats {
  const now = new Date();
  const past = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  return {
    lookbackDays,
    startDate: past.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    recentPapersScanned: recentPapersCount,
    totalReferencesExtracted: totalReferencesCount,
    uniqueWorksCited,
    trendingThreshold: minThreshold,
    trendingFoundCount,
    executionTimeMs: Date.now() - startTimeMs,
  };
}

/**
 * Detects Sleeping Beauties: Overlooked foundational works from past years
 * receiving sudden resurgent citations from this recent batch.
 */
export function detectSleepingBeauties(
  hydratedPapers: RawPaper[],
  referenceCounts: Map<string, number>,
  citingMap: Map<string, Array<{ id: string; title: string }>>,
  minAgeYears: number = 3,
  currentYear: number = 2026
): import('../types/index.ts').SleepingBeautyPaper[] {
  const results: import('../types/index.ts').SleepingBeautyPaper[] = [];

  for (const paper of hydratedPapers) {
    const rawId = paper.id;
    const pubYear = paper.publication_year || currentYear;
    const age = Math.max(1, currentYear - pubYear);

    // Must be at least minAgeYears old (dormant)
    if (age < minAgeYears) continue;

    const recentCitations = referenceCounts.get(rawId) || 0;
    if (recentCitations < 2) continue;

    const allTime = paper.cited_by_count ?? recentCitations;
    const priorCitations = Math.max(0, allTime - recentCitations);
    const historicalAnnualRate = Math.max(0.2, priorCitations / age);

    // Burst factor: recent week's normalized annual velocity vs historical baseline
    const burstMultiplier = (recentCitations * 52) / historicalAnnualRate;
    const awakeningScore = Number(
      (Math.log10(burstMultiplier + 1) * Math.sqrt(age)).toFixed(2)
    );

    if (awakeningScore >= 1.5) {
      const authorNames = (paper.authorships || [])
        .map((a) => a.author?.display_name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 4);

      const firstAuthor = authorNames[0];
      const scholarUrl = generateScholarUrl(paper.title, firstAuthor, pubYear);
      const abstract = paper.abstract || reconstructAbstract(paper.abstract_inverted_index);

      results.push({
        id: rawId,
        title: paper.title || 'Untitled Work',
        authors: authorNames.length > 0 ? authorNames : ['Unknown Author'],
        publication_year: pubYear,
        dormancy_years: age,
        recent_citations: recentCitations,
        all_time_citations: allTime,
        awakening_score: awakeningScore,
        scholar_url: scholarUrl,
        openalex_url: rawId.startsWith('http') ? rawId : `https://openalex.org/${rawId}`,
        primary_topic: paper.primary_topic?.display_name || 'Artificial Intelligence',
        abstract: abstract ? (abstract.length > 250 ? abstract.substring(0, 247) + '...' : abstract) : undefined,
        sample_awakening_citers: citingMap.get(rawId) || [],
      });
    }
  }

  results.sort((a, b) => b.awakening_score - a.awakening_score);
  return results;
}

/**
 * Screens for truly un-awakened dormant gems (historical works with < 120 citations
 * matching user's specific Google Scholar labels/frontiers like Surrogate Safety or Travel Surveys).
 */
export function screenLatentGems(
  allHistoricalWorks: RawPaper[],
  userKeywords: string[],
  currentYear: number = 2026
): import('../types/index.ts').LatentGemPaper[] {
  const gems: import('../types/index.ts').LatentGemPaper[] = [];

  for (const paper of allHistoricalWorks) {
    const pubYear = paper.publication_year || currentYear;
    const age = Math.max(1, currentYear - pubYear);

    // Must be dormant for at least 6 years
    if (age < 6) continue;

    const allTime = paper.cited_by_count ?? 0;
    // Must be completely under-cited (< 120 citations total)
    if (allTime > 120) continue;

    const textToMatch = ((paper.title || '') + ' ' + (paper.abstract || '')).toLowerCase();

    // Check matching keywords with user's customized interest labels
    const matched = userKeywords.filter((kw) => textToMatch.includes(kw.toLowerCase()));
    if (matched.length === 0) continue;

    // Compute Latent Potential Score
    const similarityEstimate = Math.min(1.0, 0.5 + matched.length * 0.2);
    const obscurityFactor = 1.0 / Math.log2(Math.max(1, allTime) + 2);
    const potentialScore = Number(
      (Math.pow(similarityEstimate, 1.3) * Math.log10(age + 1) * obscurityFactor * 16.0).toFixed(2)
    );

    if (potentialScore >= 2.5) {
      const authorNames = (paper.authorships || [])
        .map((a) => a.author?.display_name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 4);

      const firstAuthor = authorNames[0];
      const scholarUrl = generateScholarUrl(paper.title, firstAuthor, pubYear);

      gems.push({
        id: paper.id,
        title: paper.title || 'Untitled Work',
        authors: authorNames.length > 0 ? authorNames : ['Unknown Author'],
        publication_year: pubYear,
        dormancy_years: age,
        all_time_citations: allTime,
        latent_potential_score: potentialScore,
        semantic_overlap_concept: matched.join(', '),
        why_valuable: `Directly provides foundational formulations for modern ${matched[0]} inquiries with only ${allTime} historical citations.`,
        scholar_url: scholarUrl,
        openalex_url: paper.id.startsWith('http') ? paper.id : `https://openalex.org/${paper.id}`,
        primary_topic: paper.primary_topic?.display_name || 'Specialized Engineering',
        abstract: paper.abstract || reconstructAbstract(paper.abstract_inverted_index),
      });
    }
  }

  gems.sort((a, b) => b.latent_potential_score - a.latent_potential_score);
  return gems;
}
