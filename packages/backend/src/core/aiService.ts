import { loadConfig } from "../config";
import { SiteAnalysisReport } from "./aggregator";
import { Scores } from "./analyzer";
import { generateGoogleCompletion } from "./providers/google";
import { generateOllamaCompletion } from "./providers/ollama";
import { generateOpenAICompletion } from "./providers/openai";

let config = loadConfig();

// This is the complete data object needed for the report generator
export interface CompleteReportData {
  siteReport: SiteAnalysisReport;
  scores: Scores;
  aiSummary: AIQualitativeSummary;
}

// Interface for what the AI is responsible for generating
export interface AIQualitativeSummary {
  executiveSummary: string;
  keyFindings: Array<{
    title: string;
    severity: "Critical" | "High" | "Medium" | "Low" | "Good";
    type: "Weakness" | "Strength";
    description: string;
    recommendation: string;
  }>;
  strategicSuggestions: {
    suggestedContentTypes: Array<{ title: string; description: string }>;
    quickWins: Array<{ title: string; impact: string; effort: string }>;
    competitorKeywords: string[];
  };
}

// The prompt is updated to include the homepage HTML
const createSiteWideSeoPrompt = (
  report: SiteAnalysisReport,
  scores: Scores,
  homepageHtml: string
): string => {
  const reportJson = JSON.stringify(report, null, 2);
  const scoresJson = JSON.stringify(scores, null, 2);

  // Truncate HTML if it's excessively long to avoid overly large prompts
  const truncatedHtml =
    homepageHtml.length > 15000
      ? homepageHtml.substring(0, 15000) + "..."
      : homepageHtml;

  return `
    ROLE & GOAL
    You are a meticulous SEO analyst and creative strategist. Your sole objective is to perform a two-part analysis of the provided website data and respond with a single, valid JSON object that encapsulates your findings and strategic recommendations.
    Use a customer facing and easy to understand language rather than technical terms.

    CRITICAL OUTPUT CONSTRAINTS
    Your entire response MUST be a single, raw JSON object.
    The response must start with { and end with }.
    Do NOT include any text, explanations, or markdown (like json) outside the JSON object.


    INPUT DATA
    Aggregated Site Data: ${reportJson}
    Pre-Calculated Scores: ${scoresJson}
    Homepage HTML: ${truncatedHtml}

    TASKS
    Part 1: Rule-Based SEO Audit (keyFindings)
    Analyze the ${reportJson} data against the Audit Rulebook below. Generate a keyFinding object for EACH of the 11 rules. The type must be "Strength" or "Weakness", and the severity must be one of the following exact strings: "Critical", "High", "Medium", "Low", or "Good".

    Audit Rulebook:
    Title Tag Length:
    Weakness: If pagesWithShortTitles > 0 OR pagesWithLongTitles > 0. (Severity: "Medium")
    Strength: If pagesWithShortTitles == 0 AND pagesWithLongTitles == 0. (Severity: "Good")
    
    Meta Descriptions:
    Weakness: If pagesWithMissingDescriptions > 0. (Severity: "High")
    Strength: If pagesWithMissingDescriptions == 0. (Severity: "Good")
    
    H1 Headings:
    Weakness: If pagesWithMissingH1s > 0 OR pagesWithMultipleH1s > 0. (Severity: "High")
    Strength: If pagesWithMissingH1s == 0 AND pagesWithMultipleH1s == 0. (Severity: "Good")
    
    Image Alt Text:
    Weakness: If totalPagesWithMissingAlts > 0. (Severity: "Medium")
    Strength: If totalPagesWithMissingAlts == 0. (Severity: "Good")
    
    Structured Data (Schema):
    Weakness: If pagesWithSchema < totalPgsCrawled. (Severity: "Medium")
    Strength: If pagesWithSchema == totalPgsCrawled. (Severity: "Good")
    
    First Contentful Paint (FCP) in ms:
    Strength: If avgFcp <= 1000. (Severity: "Good")
    Weakness: If 1000 < avgFcp <= 1800. (Severity: "Low")
    Weakness: If 1800 < avgFcp <= 2500. (Severity: "High")
    Weakness: If avgFcp > 2500. (Severity: "Critical")
    
    Full Page Load in ms:
    Strength: If avgFullLoad < 3000. (Severity: "Good")
    Weakness: If 3000 <= avgFullLoad <= 5000. (Severity: "Medium")
    Weakness: If avgFullLoad > 5000. (Severity: "High")
    
    JavaScript Errors:
    Weakness: If pagesWithErrors > 0. (Severity: "Critical")
    Strength: If pagesWithErrors == 0. (Severity: "Good")
    
    Unused JavaScript %:
    Strength: If avgUnusedJsPercent < 20. (Severity: "Good")
    Weakness: If 20 <= avgUnusedJsPercent < 50. (Severity: "Low")
    Weakness: If 50 <= avgUnusedJsPercent <= 70. (Severity: "High")
    Weakness: If avgUnusedJsPercent > 70. (Severity: "Critical")
    
    Unused CSS %:
    Strength: If avgUnusedCssPercent < 15. (Severity: "Good")
    Weakness: If 15 <= avgUnusedCssPercent <= 40. (Severity: "Medium")
    Weakness: If avUnusedCssPercent > 40. (Severity: "High")
    
    Internal Linking (Avg per page):
    Weakness: If avgInternalLinks < 5. (Severity: "Critical")
    Weakness: If 5 <= avgInternalLinks <= 8. (Severity: "Low")
    Strength: If avgInternalLinks > 8. (Severity: "Good")


    Part 2: Strategic Brainstorming (strategicSuggestions)
    Using the context from all provided data, generate the strategicSuggestions object with the following constraints:
    suggestedContentTypes: Provide exactly 3 unique content ideas. Titles must be witty, eye-catching, and under 10 words.
    quickWins: Identify exactly 3 actionable improvements. Assign an impact and effort value from the set: "High", "Medium", "Low".
    competitorKeywords: Provide 4-6 relevant keywords based on the site's content that a competitor might target.

    FINAL JSON OUTPUT STRUCTURE
    (Your entire response must conform strictly to this structure)

    JSON

    {
      "executiveSummary": "A concise, 7-10 sentence summary of the site's main strengths and most critical weaknesses, synthesized from the analysis.",
      "keyFindings": [
        {
          "title": "Title Tag Length",
          "severity": "...",
          "type": "Strength | Weakness",
          "description": "Data-driven description based on the rule applied (e.g., 'Title tags are well-optimized with 0 short and 0 long titles found.').",
          "recommendation": "Actionable advice (e.g., 'Continue monitoring title lengths as new pages are added.')."
        }
      ],
      "strategicSuggestions": {
        "suggestedContentTypes": [
          {
            "title": "...",
            "description": "..."
          }
        ],
        "quickWins": [
          {
            "title": "...",
            "impact": "High | Medium | Low",
            "effort": "High | Medium | Low"
          }
        ],
        "competitorKeywords": [
          "..."
        ]
      }
    }
  `;
};

export const getAISummary = async (
  report: SiteAnalysisReport,
  scores: Scores,
  homepageHtml: string
): Promise<AIQualitativeSummary> => {
  // 2. Load config inside the function to get the latest settings
  const config = loadConfig();
  const prompt = createSiteWideSeoPrompt(report, scores, homepageHtml);

  console.log(`Routing AI request to: ${config.activeProvider}`);

  // 3. Add cases for 'openai' and 'google'
  switch (config.activeProvider) {
    case "openai":
      return generateOpenAICompletion(prompt);

    case "google":
      return generateGoogleCompletion(prompt);

    case "ollama":
      return generateOllamaCompletion(prompt);

    default:
      console.warn(
        `Unknown provider "${config.activeProvider}", defaulting to Ollama.`
      );
      return generateOllamaCompletion(prompt);
  }
};
