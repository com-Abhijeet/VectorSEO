import puppeteer from "puppeteer";
import handlebars from "handlebars";
import { promises as fs } from "fs";
import path from "path";
import { Scores } from "./analyzer";
import { AIQualitativeSummary } from "./aiService";
import { SiteAnalysisReport } from "./aggregator";

// The final, complete data object for the PDF report
export interface CompleteReportData {
  siteReport: SiteAnalysisReport;
  scores: Scores;
  aiSummary: AIQualitativeSummary;
}

// Register a Handlebars helper to apply CSS classes based on severity/status
handlebars.registerHelper("statusClass", (status: string) => {
  const statusMap: { [key: string]: string } = {
    Good: "status-good",
    Missing: "status-bad",
    "Multiple H1s": "status-bad",
    "Too Short": "status-warn",
    "Too Long": "status-warn",
    Critical: "impact-Critical",
    High: "impact-High",
    Medium: "impact-Medium",
    Low: "impact-Low",
  };
  return statusMap[status] || "";
});

// Register a Handlebars helper for conditional logic in the template
handlebars.registerHelper(
  "ifCond",
  function (this: any, v1, operator, v2, options) {
    switch (operator) {
      case "===":
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  }
);

// NEW: Helper to truncate long lists of URLs for the report
handlebars.registerHelper("truncateList", (array: any[], maxLength: number) => {
  if (!array || array.length === 0) {
    return "<p>None found.</p>";
  }
  const items = array
    .slice(0, maxLength)
    .map((item) => `<li>${item}</li>`)
    .join("");
  let html = `<ul>${items}</ul>`;
  if (array.length > maxLength) {
    html += `<p>...and ${array.length - maxLength} more.</p>`;
  }
  return new handlebars.SafeString(html);
});

handlebars.registerHelper("add", function (a, b) {
  return a + b;
});

handlebars.registerHelper("msToSeconds", (ms: number) => {
  if (typeof ms !== "number") return "N/A";
  return (ms / 1000).toFixed(2) + "s";
});

export const generatePDFReport = async (
  reportData: CompleteReportData
): Promise<string> => {
  // console.dir(reportData, 7);
  const domain = new URL(reportData.siteReport.url).hostname;
  const auditDate = new Date().toLocaleDateString();
  const templateData = { ...reportData, auditDate };

  const partialsDir = path.resolve(__dirname, "../templates/partials");
  const filenames = await fs.readdir(partialsDir);
  for (const filename of filenames) {
    const filePath = path.join(partialsDir, filename);
    const template = await fs.readFile(filePath, "utf-8");
    const partialName = path.basename(filename, ".hbs");
    handlebars.registerPartial(partialName, template);
  }

  const templatePath = path.resolve(__dirname, "../report-template.hbs");
  const templateHtml = await fs.readFile(templatePath, "utf-8");
  const template = handlebars.compile(templateHtml);
  let finalHtml = template(templateData);

  const chartScript = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const score = ${reportData.scores.overallScore};
        const ctx = document.getElementById('seoScoreChart')?.getContext('2d');
        if (ctx) {
          let scoreColor = '#4299e1';
          if (score >= 80) scoreColor = '#38a169';
          if (score < 50) scoreColor = '#e53e3e';
          new Chart(ctx, { /* ... Chart.js config ... */ });
        }
      });
    </script>
  `;
  finalHtml = finalHtml.replace("</body>", `${chartScript}</body>`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.emulateMediaType("screen");
  await page.setContent(finalHtml, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");

  const pdfPath = path.resolve(process.cwd(), `SEO_Audit_Report_${domain}.pdf`);

  console.log(`💾 Saving site-wide PDF to: ${pdfPath}`);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
  });

  await browser.close();
  return pdfPath;
};
