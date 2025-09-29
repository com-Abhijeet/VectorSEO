import { crawlSite, fetchPageHTML } from "./scraper";
import { getTechnicalData } from "./technicalScraper";
import { analyzeHTML } from "./analyzer";
import { getAISummary, CompleteReportData } from "./aiService";
import { generatePDFReport } from "./reportGenerator";
import { aggregateAnalyses, CombinedAnalysis } from "./aggregator";
import { sendAuditEmail } from "./emailService";
import { findContactEmail } from "../utils/emailFinder";
import { loadConfig } from "../config";
import { calculateSiteScores } from "../utils/calculateSiteScores";

let config = loadConfig();

export interface ProgressUpdate {
  message: string;
  percent: number;
}

export interface AuditOptions {
  url: string;
  provider: string;
  limit: number;
  send: boolean;
  onProgress: (update: ProgressUpdate) => void;
}

export const runAudit = async (options: AuditOptions) => {
  const { url, limit, provider, send, onProgress } = options;

  onProgress({ message: "1/7: Discovering pages to analyze...", percent: 10 });
  const discoveredUrls = await crawlSite(url, limit);
  onProgress({
    message: `Crawl complete. Found ${discoveredUrls.length} pages.`,
    percent: 20,
  });

  onProgress({
    message: `2/7: Performing deep analysis on ${discoveredUrls.length} pages...`,
    percent: 30,
  });
  const analysisPromises = discoveredUrls.map(
    async (pageUrl): Promise<CombinedAnalysis | null> => {
      const scrapeResult = await fetchPageHTML(pageUrl);
      if (!scrapeResult.success || !scrapeResult.html) return null;
      const technicalResult = await getTechnicalData(pageUrl);
      const onPageResult = analyzeHTML(
        scrapeResult.html,
        pageUrl,
        scrapeResult.headers
      );
      return {
        onPage: onPageResult,
        tech: technicalResult,
        html: scrapeResult.html,
      };
    }
  );
  const combinedAnalyses = (await Promise.all(analysisPromises)).filter(
    (a): a is CombinedAnalysis => a !== null
  );
  if (combinedAnalyses.length === 0) {
    throw new Error("Could not successfully analyze any pages.");
  }
  onProgress({
    message: `Analysis complete for ${combinedAnalyses.length} pages.`,
    percent: 50,
  });

  onProgress({ message: "3/7: Aggregating site-wide data...", percent: 60 });
  const siteReport = aggregateAnalyses(combinedAnalyses, url);
  onProgress({ message: "Aggregation complete.", percent: 65 });

  onProgress({ message: "4/7: Calculating SEO scores...", percent: 70 });
  const scores = calculateSiteScores(siteReport);
  onProgress({ message: "Scoring complete.", percent: 75 });

  onProgress({
    message: `5/7: Generating AI summary with ${provider}...`,
    percent: 80,
  });
  const homepageAnalysis = combinedAnalyses.find((a) => a.onPage.url === url);
  const aiSummary = await getAISummary(
    siteReport,
    scores,
    homepageAnalysis?.html || ""
  );
  onProgress({ message: "AI summary generated.", percent: 90 });

  onProgress({ message: "6/7: Creating PDF report...", percent: 95 });
  const completeReportData: CompleteReportData = {
    siteReport,
    scores,
    aiSummary,
  };
  const pdfPath = await generatePDFReport(completeReportData);
  onProgress({ message: "PDF report created.", percent: 100 });

  const result = {
    pdfPath,
    emailSentTo: null as string | null,
    emailError: null as string | null,
  };

  if (send && config.email.enabled) {
    onProgress({
      message: "7/7: Searching for contact email...",
      percent: 100,
    });
    const recipientEmail = findContactEmail(combinedAnalyses);
    if (recipientEmail) {
      onProgress({
        message: `Sending report to ${recipientEmail}...`,
        percent: 100,
      });
      await sendAuditEmail({
        to: recipientEmail,
        domain: new URL(url).hostname,
        pdfPath: pdfPath,
      });
      result.emailSentTo = recipientEmail;
    } else {
      result.emailError = "Could not find contact email.";
    }
  }

  return result;
};
