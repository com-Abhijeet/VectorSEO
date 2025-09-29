import { SiteAnalysisReport } from "../core/aggregator";
import { Scores } from "../core/analyzer";

/**
 * Calculates scores based on the aggregated site-wide analysis report.
 * @param report The SiteAnalysisReport object from the aggregator.
 * @returns A Scores object with overall and category-specific scores.
 */
export const calculateSiteScores = (report: SiteAnalysisReport): Scores => {
  let metadataScore = 100;
  let contentScore = 100;
  let technicalScore = 100;

  const totalPages = report.totalPgsCrawled; // --- Metadata Scoring (Unchanged) ---

  const shortTitlePenalty =
    (report.overview.pagesWithShortTitles.length / totalPages) * 20;
  const longTitlePenalty =
    (report.overview.pagesWithLongTitles.length / totalPages) * 20;
  const missingDescPenalty =
    (report.overview.pagesWithMissingDescriptions.length / totalPages) * 30;
  metadataScore -= shortTitlePenalty + longTitlePenalty + missingDescPenalty; // --- Content Scoring (Unchanged) ---

  const missingH1Penalty =
    (report.overview.pagesWithMissingH1s.length / totalPages) * 40;
  const multipleH1Penalty =
    (report.overview.pagesWithMultipleH1s.length / totalPages) * 20;
  const missingAltsPenalty =
    (report.images.totalPagesWithMissingAlts.length / totalPages) * 30;
  contentScore -= missingH1Penalty + multipleH1Penalty + missingAltsPenalty;
  if (report.avgWordCount < 350) contentScore -= 10; // --- NEW: Expanded Technical Scoring ---

  const { technical } = report;

  // 1. Performance Penalties (times in ms)
  if (technical.avgFcp > 2500) technicalScore -= 15; // FCP > 2.5s is poor
  else if (technical.avgFcp > 1800) technicalScore -= 7; // FCP > 1.8s needs improvement

  if (technical.avgFullLoad > 5000)
    technicalScore -= 15; // Full Load > 5s is slow
  else if (technical.avgFullLoad > 3000) technicalScore -= 7;

  // 2. Error Penalties
  if (technical.pagesWithErrors.length > 0) {
    // Apply a penalty for each page with errors, up to a max of 30
    technicalScore -= Math.min(technical.pagesWithErrors.length * 5, 30);
  }

  // 3. Code Bloat Penalties
  if (technical.avgUnusedJsPercent > 50) {
    technicalScore -= (technical.avgUnusedJsPercent - 50) / 5; // Increasingly penalize JS bloat over 50%
  }
  if (technical.avgUnusedCssPercent > 40) {
    technicalScore -= (technical.avgUnusedCssPercent - 40) / 10; // Increasingly penalize CSS bloat over 40%
  } // Ensure scores don't go below 0

  // --- Final Calculations ---

  metadataScore = Math.max(0, Math.round(metadataScore));
  contentScore = Math.max(0, Math.round(contentScore));
  technicalScore = Math.max(0, Math.round(technicalScore)); // Calculate weighted overall score

  const overallScore = Math.round(
    metadataScore * 0.35 + contentScore * 0.35 + technicalScore * 0.3 // Adjusted weights for technical score
  );

  return {
    overallScore,
    categoryScores: {
      metadata: metadataScore,
      content: contentScore,
      technical: technicalScore,
    },
  };
};
