import puppeteer, { Browser } from "puppeteer";

// --- DATA STRUCTURES FOR OUR FINDINGS ---

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint in milliseconds
  domContentLoaded: number; // DOM Content Loaded in milliseconds
  fullLoad: number; // Full Page Load in milliseconds
}

export interface CodeCoverage {
  js: { totalBytes: number; unusedBytes: number; unusedPercent: number };
  css: { totalBytes: number; unusedBytes: number; unusedPercent: number };
}

export interface CapturedConsoleMessage {
  type: string;
  text: string;
}

// NEW: Interface for pixel width measurements
export interface PixelWidths {
  title: number;
  metaDescription: number;
}

export interface TechnicalData {
  performance: PerformanceMetrics | null;
  consoleMessages: CapturedConsoleMessage[];
  jsErrors: string[];
  coverage: CodeCoverage | null;
  screenshotBase64: string | null;
  pixelWidths: PixelWidths | null; 
}

/**
 * Uses Puppeteer to perform a deep technical analysis of a single URL.
 * @param url The URL to analyze.
 * @returns A promise that resolves to a comprehensive TechnicalData object.
 */
export const getTechnicalData = async (url: string): Promise<TechnicalData> => {
  let browser: Browser | null = null;
  const consoleMessages: CapturedConsoleMessage[] = [];
  const jsErrors: string[] = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    page.on("pageerror", (error) => jsErrors.push(error.message));
    page.on("console", (msg) => {
      const type = msg.type();
      if (type === "warn" || type === "error") {
        consoleMessages.push({ type, text: msg.text() });
      }
    });

    await Promise.all([
      page.coverage.startJSCoverage(),
      page.coverage.startCSSCoverage(),
    ]);

    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage(),
    ]);

    const calculateUsage = (coverage: any[]) => {
      let totalBytes = 0;
      let unusedBytes = 0;
      for (const entry of coverage) {
        totalBytes += entry.text.length;
        for (const range of entry.ranges)
          unusedBytes += range.end - range.start - 1;
      }
      return {
        totalBytes,
        unusedBytes,
        unusedPercent:
          totalBytes > 0 ? Math.round((unusedBytes / totalBytes) * 100) : 0,
      };
    };

    const coverage: CodeCoverage = {
      js: calculateUsage(jsCoverage),
      css: calculateUsage(cssCoverage),
    };

    const performance: PerformanceMetrics | null = await page.evaluate(() => {
      if (!window.performance || !window.performance.timing) {
        return null;
      }
      const timing = window.performance.timing;
      const fcpEntry = window.performance
        .getEntriesByType("paint")
        .find((e) => e.name === "first-contentful-paint");

      return {
        fcp: Math.round(fcpEntry?.startTime || 0),
        domContentLoaded:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        fullLoad: timing.loadEventEnd - timing.navigationStart,
      };
    });

    // NEW: Logic to measure pixel widths using a canvas
    const pixelWidths: PixelWidths | null = await page.evaluate(() => {
      const titleEl = document.querySelector("title");
      const descriptionEl = document.querySelector('meta[name="description"]');

      if (!titleEl && !descriptionEl) return null;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return null;

      // Approximate font for Google search results title
      context.font = "18px Arial";
      const titleWidth = titleEl
        ? context.measureText(titleEl.innerText).width
        : 0;

      // Approximate font for Google search results description
      context.font = "13px Arial";
      const descriptionWidth = descriptionEl
        ? context.measureText((descriptionEl as HTMLMetaElement).content).width
        : 0;

      return {
        title: Math.round(titleWidth),
        metaDescription: Math.round(descriptionWidth),
      };
    });

    const screenshotBase64 = await page.screenshot({
      encoding: "base64",
      type: "jpeg",
      quality: 75,
    });

    return {
      performance,
      consoleMessages,
      jsErrors,
      coverage,
      screenshotBase64,
      pixelWidths, // Add new data to the return object
    };
  } catch (error) {
    console.error(`Puppeteer error for ${url}:`, (error as Error).message);
    return {
      performance: null,
      consoleMessages: [],
      jsErrors: [`Failed to analyze page: ${(error as Error).message}`],
      coverage: null,
      screenshotBase64: null,
      pixelWidths: null, // Ensure return object matches interface on error
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
