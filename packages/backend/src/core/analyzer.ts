import * as cheerio from "cheerio";
import { SiteAnalysisReport } from "./aggregator";

// --- INTERFACES (Updated with new sections) ---

export interface TitleAnalysis {
  text: string;
  length: number;
  status: "Good" | "Too Short" | "Too Long" | "Missing";
}

export interface MetaDescriptionAnalysis {
  text: string;
  length: number;
  status: "Good" | "Too Short" | "Too Long" | "Missing";
}

export interface HeadingAnalysis {
  h1: {
    count: number;
    texts: string[];
    status: "Good" | "Missing" | "Multiple H1s";
  };
  structure: {
    isLogical: boolean;
    details: string[];
  };
}

export interface ImageAnalysis {
  totalCount: number;
  missingAlt: number;
  decorative: number; // alt=""
}

export interface LinkAnalysis {
  totalCount: number;
  internalCount: number;
  externalCount: number;
  nofollowCount: number;
}

export interface StructuredDataAnalysis {
  found: boolean;
  types: string[];
}

export interface SocialAnalysis {
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
  };
  twitter: {
    title: string | null;
    description: string | null;
    image: string | null;
    card: string | null;
  };
}

export interface TechAnalysis {
  viewport: string | null;
  favicon: string | null;
  lang: string | null;
  isGzipEnabled: boolean; // Add this new property
}

export interface SeoAnalysis {
  url: string;
  title: TitleAnalysis;
  metaDescription: MetaDescriptionAnalysis;
  headings: HeadingAnalysis;
  wordCount: number;
  images: ImageAnalysis;
  links: LinkAnalysis; // New
  structuredData: StructuredDataAnalysis; // New
  canonicalUrl: string | null;
  social: SocialAnalysis;
  tech: TechAnalysis;
}

// Interface for our calculated scores
export interface Scores {
  overallScore: number;
  categoryScores: {
    metadata: number;
    content: number;
    technical: number;
  };
}

// --- HELPER FUNCTIONS ---

const analyzeTitle = ($: cheerio.CheerioAPI): TitleAnalysis => {
  const titleElement = $("title");
  if (titleElement.length === 0) {
    return { text: "", length: 0, status: "Missing" };
  }
  const text = titleElement.text().trim();
  const length = text.length;
  let status: TitleAnalysis["status"] = "Good";
  if (length > 60) status = "Too Long";
  if (length < 30) status = "Too Short";
  return { text, length, status };
};

const analyzeMetaDescription = (
  $: cheerio.CheerioAPI
): MetaDescriptionAnalysis => {
  const metaElement = $('meta[name="description"]');
  if (metaElement.length === 0) {
    return { text: "", length: 0, status: "Missing" };
  }
  const text = metaElement.attr("content")?.trim() || "";
  const length = text.length;
  let status: MetaDescriptionAnalysis["status"] = "Good";
  if (length > 160) status = "Too Long";
  if (length < 70) status = "Too Short";
  return { text, length, status };
};

const analyzeHeadings = ($: cheerio.CheerioAPI): HeadingAnalysis => {
  const h1s = $("h1")
    .map((i, el) => $(el).text().trim())
    .get();
  let h1Status: HeadingAnalysis["h1"]["status"] = "Good";
  if (h1s.length === 0) h1Status = "Missing";
  if (h1s.length > 1) h1Status = "Multiple H1s";
  const headings = $("h1, h2, h3, h4, h5, h6");
  let lastLevel = 0;
  let isLogical = true;
  const structureDetails: string[] = [];
  headings.each((i, el) => {
    const currentLevel = parseInt(el.tagName.substring(1), 10);
    if (lastLevel !== 0 && currentLevel > lastLevel + 1) {
      isLogical = false;
      structureDetails.push(
        `Skipped heading level: <h${lastLevel}> followed by <h${currentLevel}>`
      );
    }
    lastLevel = currentLevel;
  });
  return {
    h1: { count: h1s.length, texts: h1s, status: h1Status },
    structure: { isLogical, details: structureDetails },
  };
};

const analyzeImages = ($: cheerio.CheerioAPI): ImageAnalysis => {
  const images = $("img");
  const totalCount = images.length;
  let missingAlt = 0;
  let decorative = 0;
  images.each((i, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined) {
      missingAlt++;
    } else if (alt.trim() === "") {
      decorative++;
    }
  });
  return { totalCount, missingAlt, decorative };
};

// New helper function for link analysis
const analyzeLinks = ($: cheerio.CheerioAPI, baseUrl: string): LinkAnalysis => {
  const links = $("a[href]");
  const totalCount = links.length;
  let internalCount = 0;
  let externalCount = 0;
  let nofollowCount = 0;
  const siteHostname = new URL(baseUrl).hostname;

  links.each((i, el) => {
    const href = $(el).attr("href") || "";
    try {
      const linkUrl = new URL(href, baseUrl);
      if (linkUrl.hostname === siteHostname) {
        internalCount++;
      } else {
        externalCount++;
      }
    } catch (error) {
      // Catches mailto:, tel:, etc. and treats them as external
      if (href.startsWith("http")) {
        externalCount++;
      }
    }

    if ($(el).attr("rel")?.includes("nofollow")) {
      nofollowCount++;
    }
  });

  return { totalCount, internalCount, externalCount, nofollowCount };
};

// New helper function for structured data
const analyzeStructuredData = (
  $: cheerio.CheerioAPI
): StructuredDataAnalysis => {
  const scripts = $('script[type="application/ld+json"]');
  const types: string[] = [];
  scripts.each((i, el) => {
    try {
      const scriptContent = $(el).html();
      if (scriptContent) {
        const jsonData = JSON.parse(scriptContent);
        if (jsonData && jsonData["@type"]) {
          types.push(
            Array.isArray(jsonData["@type"])
              ? jsonData["@type"].join(", ")
              : jsonData["@type"]
          );
        }
      }
    } catch (error) {
      // Ignore parsing errors for malformed JSON
    }
  });
  return { found: types.length > 0, types };
};

const analyzeSocial = ($: cheerio.CheerioAPI): SocialAnalysis => {
  return {
    openGraph: {
      title: $('meta[property="og:title"]').attr("content")?.trim() || null,
      description:
        $('meta[property="og:description"]').attr("content")?.trim() || null,
      image: $('meta[property="og:image"]').attr("content")?.trim() || null,
    },
    twitter: {
      title: $('meta[name="twitter:title"]').attr("content")?.trim() || null,
      description:
        $('meta[name="twitter:description"]').attr("content")?.trim() || null,
      image: $('meta[name="twitter:image"]').attr("content")?.trim() || null,
      card: $('meta[name="twitter:card"]').attr("content")?.trim() || null,
    },
  };
};

// Updated to include language attribute check
const analyzeTech = (
  $: cheerio.CheerioAPI,
  headers: Record<string, any> | null
): TechAnalysis => {
  const contentEncoding = headers?.["content-encoding"] || "";

  return {
    viewport: $('meta[name="viewport"]').attr("content")?.trim() || null,
    favicon: $('link[rel="icon"]').attr("href")?.trim() || null,
    lang: $("html").attr("lang")?.trim() || null,
    isGzipEnabled: contentEncoding.includes("gzip"),
  };
};

export const analyzeHTML = (
  html: string,
  url: string,
  headers: Record<string, any> | null
): SeoAnalysis => {
  const $ = cheerio.load(html);

  const analysis: SeoAnalysis = {
    url,
    title: analyzeTitle($),
    metaDescription: analyzeMetaDescription($),
    headings: analyzeHeadings($),
    wordCount: $("body").text().trim().replace(/\s+/g, " ").split(" ").length,
    images: analyzeImages($),
    links: analyzeLinks($, url),
    structuredData: analyzeStructuredData($),
    canonicalUrl: $('link[rel="canonical"]').attr("href")?.trim() || null,
    social: analyzeSocial($),
    tech: analyzeTech($, headers), // Pass headers to the helper
  };

  return analysis;
};
