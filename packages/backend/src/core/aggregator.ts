import { SeoAnalysis } from "./analyzer";
import { TechnicalData } from "./technicalScraper";


export interface CombinedAnalysis {
  onPage: SeoAnalysis;
  tech: TechnicalData;
  html: string | null;
}


export interface TechnicalSummary {
  avgFcp: number;
  avgFullLoad: number;
  pagesWithErrors: Array<{ url: string; errors: string[] }>;
  avgUnusedJsPercent: number;
  avgUnusedCssPercent: number;
  pagesWithGzip: number; // New property
}


export interface SiteAnalysisReport {
  url: string;
  totalPgsCrawled: number;
  avgWordCount: number;
  overview: {
    pagesWithShortTitles: string[];
    pagesWithLongTitles: string[];
    pagesWithMissingDescriptions: string[];
    pagesWithMissingH1s: string[];
    pagesWithMultipleH1s: string[];
  };
  images: {
    totalImages: number;
    totalPagesWithMissingAlts: string[];
  };
  links: {
    avgInternalLinks: number;
    avgExternalLinks: number;
  };
  structuredData: {
    pagesWithSchema: number;
    schemaTypes: string[];
  };
  technical: TechnicalSummary;
}

/**
 * Aggregates both on-page and technical analysis results into a single site-wide report.
 * @param analyses An array of CombinedAnalysis objects.
 * @param startUrl The original starting URL for the audit.
 * @returns A single, comprehensive SiteAnalysisReport object.
 */
export const aggregateAnalyses = (
  analyses: CombinedAnalysis[],
  startUrl: string
): SiteAnalysisReport => {
  const totalPgsCrawled = analyses.length;
  if (totalPgsCrawled === 0) {
    throw new Error("Cannot generate a report from zero pages.");
  }

  const report: SiteAnalysisReport = {
    url: startUrl,
    totalPgsCrawled,
    avgWordCount: 0,
    overview: {
      pagesWithShortTitles: [],
      pagesWithLongTitles: [],
      pagesWithMissingDescriptions: [],
      pagesWithMissingH1s: [],
      pagesWithMultipleH1s: [],
    },
    images: { totalImages: 0, totalPagesWithMissingAlts: [] },
    links: { avgInternalLinks: 0, avgExternalLinks: 0 },
    structuredData: { pagesWithSchema: 0, schemaTypes: [] },
    technical: {
      avgFcp: 0,
      avgFullLoad: 0,
      pagesWithErrors: [],
      avgUnusedJsPercent: 0,
      avgUnusedCssPercent: 0,
      pagesWithGzip: 0, 
    },
  };

  let totalWordCount = 0,
    totalInternalLinks = 0,
    totalExternalLinks = 0;
  let totalFcp = 0,
    totalFullLoad = 0,
    totalUnusedJs = 0,
    totalUnusedCss = 0;
  const allSchemaTypes = new Set<string>();

  for (const analysis of analyses) {
    const { onPage, tech } = analysis;


    if (onPage.title.status === "Too Short")
      report.overview.pagesWithShortTitles.push(onPage.url);
    if (onPage.title.status === "Too Long")
      report.overview.pagesWithLongTitles.push(onPage.url);
    if (onPage.metaDescription.status === "Missing")
      report.overview.pagesWithMissingDescriptions.push(onPage.url);
    if (onPage.headings.h1.status === "Missing")
      report.overview.pagesWithMissingH1s.push(onPage.url);
    if (onPage.headings.h1.status === "Multiple H1s")
      report.overview.pagesWithMultipleH1s.push(onPage.url);

    report.images.totalImages += onPage.images.totalCount;
    if (onPage.images.missingAlt > 0)
      report.images.totalPagesWithMissingAlts.push(onPage.url);

    totalWordCount += onPage.wordCount;
    totalInternalLinks += onPage.links.internalCount;
    totalExternalLinks += onPage.links.externalCount;

    if (onPage.structuredData.found) {
      report.structuredData.pagesWithSchema++;
      onPage.structuredData.types.forEach((type) => allSchemaTypes.add(type));
    }


    if (onPage.tech.isGzipEnabled) {
      report.technical.pagesWithGzip++;
    }

    if (tech.performance) {
      totalFcp += tech.performance.fcp;
      totalFullLoad += tech.performance.fullLoad;
    }
    if (tech.jsErrors.length > 0) {
      report.technical.pagesWithErrors.push({
        url: onPage.url,
        errors: tech.jsErrors,
      });
    }
    if (tech.coverage) {
      totalUnusedJs += tech.coverage.js.unusedPercent;
      totalUnusedCss += tech.coverage.css.unusedPercent;
    }
  }

  // Calculate averages
  report.avgWordCount = Math.round(totalWordCount / totalPgsCrawled);
  report.links.avgInternalLinks = Math.round(
    totalInternalLinks / totalPgsCrawled
  );
  report.links.avgExternalLinks = Math.round(
    totalExternalLinks / totalPgsCrawled
  );
  report.structuredData.schemaTypes = [...allSchemaTypes];

  report.technical.avgFcp = Math.round(totalFcp / totalPgsCrawled);
  report.technical.avgFullLoad = Math.round(totalFullLoad / totalPgsCrawled);
  report.technical.avgUnusedJsPercent = Math.round(
    totalUnusedJs / totalPgsCrawled
  );
  report.technical.avgUnusedCssPercent = Math.round(
    totalUnusedCss / totalPgsCrawled
  );

  return report;
};
