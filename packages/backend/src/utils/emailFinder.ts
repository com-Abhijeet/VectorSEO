import { CombinedAnalysis } from "../core/aggregator";

const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

export const findContactEmail = (
  analyses: CombinedAnalysis[]
): string | null => {
  const contactPage = analyses.find((a) => a.onPage.url.includes("contact"));

  // Search the contact page's HTML first
  if (contactPage && contactPage.html) {
    const matches = contactPage.html.match(emailRegex);
    if (matches) return matches[0];
  }

  // If not found, search all pages' HTML
  for (const analysis of analyses) {
    if (analysis.html) {
      const matches = analysis.html.match(emailRegex);
      if (matches) return matches[0];
    }
  }

  return null;
};
