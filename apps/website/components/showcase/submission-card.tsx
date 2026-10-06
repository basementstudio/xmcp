import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ArrowUpRight } from "lucide-react";

const steps = [
  {
    title: "Add your server",
    description:
      "Create a Markdown entry with a description and connection URL.",
  },
  {
    title: "Include your logo",
    description: "Add a square image so your server is easy to recognize.",
  },
  {
    title: "Open a pull request",
    description: "Run the checks and submit your entry for review.",
  },
];

export function ShowcaseSubmissionCard() {
  return (
    <section
      aria-labelledby="showcase-submission-title"
      className="col-span-12 mt-8 overflow-hidden rounded-lg border border-brand-neutral-500 bg-brand-neutral-600/40 md:mt-16"
    >
      <div className="grid md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col items-start p-6 md:p-8 lg:p-10">
          <span className="mb-5 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-neutral-100">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-brand-white"
            />
            Submissions are open
          </span>
          <h2
            id="showcase-submission-title"
            className="max-w-sm text-balance text-2xl font-medium leading-tight text-brand-white md:text-3xl"
          >
            Showcase your MCP server
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-brand-neutral-100">
            Built with xmcp? Share your server with the community and help
            others discover what it can do.
          </p>
          <div className="mt-7 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <a
              href="https://github.com/basementstudio/xmcp/tree/main/apps/website/content/showcase"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-brand-white bg-brand-white px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-white"
            >
              <GitHubLogoIcon aria-hidden="true" className="size-4 shrink-0" />
              Contribute on GitHub
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a
              href="https://github.com/basementstudio/xmcp/blob/main/apps/website/README.md#showcase-submissions"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline-group inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md text-sm text-brand-neutral-50 transition-colors hover:text-brand-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-white"
            >
              <span className="link-underline-label">Submission guide</span>
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
        <div className="flex flex-col justify-center border-t border-brand-neutral-500 p-6 md:border-t-0 md:border-l md:p-8 lg:p-10">
          <h3 className="mb-6 text-xs font-mono uppercase tracking-wider text-brand-neutral-100">
            How to get featured
          </h3>
          <ol className="flex flex-col gap-6">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 font-mono text-xs leading-5 text-brand-neutral-100"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium text-brand-white">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-neutral-100">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
