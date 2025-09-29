import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import boxen from "boxen";
import { runAudit, ProgressUpdate } from "./core/auditRunner"; // Import the new runner and type
import dotenv from "dotenv";
dotenv.config();

const program = new Command();

program
  .version("1.0.0")
  .name("vector-seo")
  .description("An AI-powered SEO Audit CLI Tool by VectorSEO");

program
  .command("audit")
  .description("Run a full SEO audit on a target URL")
  .argument("<url>", "The starting URL to audit")
  .option("-p, --provider <ai-provider>", "AI provider for analysis", "ollama")
  .option("-l, --limit <number>", "Max number of pages to crawl", "10")
  .option("-s, --send", "Find a contact email and send the report", false)
  .action(
    async (
      url: string,
      options: { provider: string; limit: string; send: boolean }
    ) => {
      console.clear();
      console.log(
        chalk.cyan(figlet.textSync("VectorSEO", { horizontalLayout: "full" }))
      );
      console.log(chalk.dim(" AI-Powered SEO Analysis | v1.0.0\n"));

      const spinner = ora(chalk.bold(`Auditing ${chalk.cyan(url)}...`)).start();

      // Define the progress callback for the CLI
      const onProgress = (update: ProgressUpdate) => {
        spinner.text = chalk.bold(update.message);
      };

      try {
        const result = await runAudit({
          url,
          provider: options.provider,
          limit: parseInt(options.limit, 10),
          send: options.send,
          onProgress, // Pass the callback to the runner
        });

        spinner.succeed(chalk.green.bold("🎉 Audit Complete!"));

        let successMessage = `Your report is ready:\n${chalk.cyan.underline(
          result.pdfPath
        )}`;
        if (result.emailSentTo) {
          successMessage += `\n\n📧 Report sent to: ${chalk.cyan(
            result.emailSentTo
          )}`;
        } else if (options.send && result.emailError) {
          successMessage += `\n\n⚠️  ${chalk.yellow(result.emailError)}`;
        }

        console.log(
          boxen(successMessage, {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            title: "VectorSEO Report",
            titleAlignment: "center",
          })
        );
      } catch (error) {
        spinner.fail("A critical error occurred.");
        console.error(
          chalk.red(
            boxen(error instanceof Error ? error.message : String(error), {
              padding: 1,
              title: "Error",
            })
          )
        );
        process.exit(1);
      }
    }
  );

program.parse(process.argv);
