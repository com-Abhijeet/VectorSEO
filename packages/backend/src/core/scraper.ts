import puppeteer, { Browser } from "puppeteer";
import * as cheerio from "cheerio";

export interface ScrapeResult {
  success: boolean;
  html: string | null;
  error: string | null;
  status: number | null;
  headers: Record<string, any> | null;
}

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36";
const REQUEST_TIMEOUT = 20000;
const MAX_RETRIES = 2;

// --- Internal Browser Management ---
let browserInstance: Browser | null = null;

/**
 * Gets a shared Puppeteer browser instance. Launches it if it doesn't exist.
 * This version includes a fix for finding the executable in a packaged Electron app.
 */
const getBrowserInstance = async (): Promise<Browser> => {
  if (browserInstance) {
    return browserInstance;
  }

  // Helper function to get the correct executable path
  const getExecutablePath = () => {
    // // When packaged, the path needs to be adjusted
    // if (process.env.NODE_ENV === "production") {
    //   return puppeteer
    //     .executablePath()
    //     .replace("app.asar", "app.asar.unpacked");
    // }
    // // In development, the default path is correct
    return puppeteer.executablePath();
  };

  browserInstance = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return browserInstance;
};
/**
 * Closes the shared browser instance if it exists.
 */
const closeBrowserInstance = async () => {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
};
// ------------------------------------

/**
 * Fetches the fully rendered HTML content of a single web page.
 * Manages its own browser page from the shared browser instance.
 */
export const fetchPageHTML = async (url: string): Promise<ScrapeResult> => {
  const browser = await getBrowserInstance();
  let page;

  for (let i = 0; i < MAX_RETRIES + 1; i++) {
    try {
      new URL(url);
      page = await browser.newPage();

      await page.setUserAgent(BROWSER_USER_AGENT);
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: REQUEST_TIMEOUT,
      });
      if (!response) throw new Error("Page did not return a response.");

      const status = response.status();
      if (status >= 400)
        throw new Error(`Server responded with error status: ${status}`);

      const html = await page.content();
      return {
        success: true,
        html,
        error: null,
        status: response.status(),
        headers: response.headers(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (i === MAX_RETRIES) {
        return {
          success: false,
          html: null,
          error: errorMessage,
          status: null,
          headers: null,
        };
      }
    } finally {
      if (page) await page.close();
    }
  }
  return {
    success: false,
    html: null,
    error: "Exceeded max retries without success.",
    status: null,
    headers: null,
  };
};

/**
 * Crawls a website to discover all internal URLs. It now manages the browser lifecycle internally.
 */
export const crawlSite = async (
  startUrl: string,
  maxPages: number = 50
): Promise<string[]> => {
  try {
    const urlsToVisit: Set<string> = new Set([startUrl]);
    const visitedUrls: Set<string> = new Set();
    const siteHostname = new URL(startUrl).hostname;
    const CONCURRENT_REQUESTS = 5;

    while (urlsToVisit.size > 0 && visitedUrls.size < maxPages) {
      const currentBatch = Array.from(urlsToVisit).slice(
        0,
        CONCURRENT_REQUESTS
      );
      currentBatch.forEach((url) => {
        urlsToVisit.delete(url);
        visitedUrls.add(url);
      });

      const promises = currentBatch.map(async (currentUrl) => {
        if (
          visitedUrls.size + urlsToVisit.size > maxPages &&
          !visitedUrls.has(currentUrl)
        )
          return;

        console.log(
          `Crawling: [${visitedUrls.size}/${maxPages}] ${currentUrl}`
        );
        const scrapeResult = await fetchPageHTML(currentUrl); // No longer needs browser passed in

        if (!scrapeResult.success || !scrapeResult.html) {
          console.warn(
            `⚠️  Could not fetch ${currentUrl}: ${scrapeResult.error}`
          );
          return;
        }

        const $ = cheerio.load(scrapeResult.html);
        $("a[href]").each((i, element) => {
          const href = $(element).attr("href");
          if (!href) return;
          try {
            const absoluteUrl = new URL(href, startUrl).href.split("#")[0];
            const urlHostname = new URL(absoluteUrl).hostname;
            if (
              urlHostname === siteHostname &&
              !visitedUrls.has(absoluteUrl) &&
              !urlsToVisit.has(absoluteUrl)
            ) {
              if (
                !/\.(pdf|jpg|jpeg|png|gif|svg|zip|css|js|xml|ico|webp)$/i.test(
                  absoluteUrl
                )
              ) {
                urlsToVisit.add(absoluteUrl);
              }
            }
          } catch (error) {
            /* Ignore invalid URLs */
          }
        });
      });
      await Promise.all(promises);
    }
    return Array.from(visitedUrls).slice(0, maxPages);
  } finally {
    // Crucially, close the shared browser instance after the entire crawl is finished.
    await closeBrowserInstance();
  }
};
