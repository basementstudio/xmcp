import type { Metadata } from "next";
import { DocsBody } from "@/components/layout/page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Telemetry - xmcp",
  description:
    "Learn what xmcp collects, why the data matters, and how to disable telemetry at any time.",
  alternates: {
    canonical: "https://xmcp.dev/telemetry",
  },
};

export default function TelemetryPage() {
  return (
    <main className="flex w-full justify-center px-4 lg:px-8">
      <article className="flex w-full max-w-[860px] flex-col gap-6 py-16">
        <header className="flex flex-col gap-4">
          <h1 className="display font-medium text-white">Telemetry</h1>
          <p>
            xmcp traces a handful of anonymous build events so we can keep
            product decisions grounded in real-world usage. You stay in control
            and can switch it off at any moment.
          </p>
        </header>
        <DocsBody className="w-full">
          <section>
            <h2>Why we collect telemetry</h2>
            <p>
              Anonymous signals highlight whether transports, adapters, or new
              compiler behavior works in practice without requiring manual bug
              reports. Seeing which builds succeed, how long they take, and
              where they fail lets us prioritize fixes that unblock the most
              people.
            </p>
          </section>

          <section>
            <h2>What is being collected?</h2>
            <p>
              We capture general usage information tied to the command you run (
              <code>xmcp dev</code> or <code>xmcp build</code>) so we can spot
              regressions. Specifically, we track the following anonymously:
            </p>
            <ul>
              <li>
                <strong>Command + versions.</strong> Which command was invoked,
                the xmcp release, and the Node.js version in use.
              </li>
              <li>
                <strong>General machine info.</strong> OS family and release,
                CPU architecture and count, total memory, and whether the run
                happened in CI, Docker, or WSL.
              </li>
              <li>
                <strong>Project traits.</strong> The selected adapter/transport
                and counts of components (tools, prompts, resources) so we know
                which surfaces are being exercised.
              </li>
              <li>
                <strong>Performance snapshots.</strong> Duration of each run,
                bundle size for successful builds, and a coarse error category
                if something fails.
              </li>
              <li>
                <strong>Privacy guardrails.</strong> A random install ID links
                related events so we can detect regressions, but it never
                contains repository details. No code, prompts, environment
                variables, logs, or secrets leave your machine.
              </li>
            </ul>
            <p>
              This list is audited regularly to ensure it stays accurate, and it
              explicitly excludes personal data, email addresses, access tokens,
              and any identifiers tied to you or your organization.
            </p>
            <p>
              Set <code>XMCP_DEBUG_TELEMETRY=true</code> to print every payload
              locally. This flag mirrors the data to <code>stderr</code> with
              the <code>[telemetry]</code> prefix but does <em>not</em> stop
              events from being sent; use{" "}
              <code>XMCP_TELEMETRY_DISABLED=true</code> if you want to pause
              telemetry entirely.
            </p>
          </section>

          <section>
            <h2>Opt out at any time</h2>
            <p>
              Telemetry is optional. Disable it temporarily, per environment, or
              everywhere:
            </p>
            <ul>
              <li>
                <strong>Per command or CI job.</strong>{" "}
                <code>XMCP_TELEMETRY_DISABLED=true npx xmcp dev</code> (or{" "}
                <code>build</code>) prevents telemetry from booting for that
                run, which is ideal for sensitive builds or automated pipelines.
              </li>
              <li>
                <strong>Persistent opt-out.</strong> Add
                <code>XMCP_TELEMETRY_DISABLED=true</code> to your shell profile,
                project <code>.env</code>, or CI secrets. xmcp checks the
                variable before creating an anonymous ID, so no data leaves your
                machine.
              </li>
              <li>
                <strong>Re-enabling.</strong> Remove the environment variable
                (or delete <code>telemetry.json</code>) and rerun{" "}
                <code>xmcp dev</code> to recreate a fresh anonymous ID along
                with the opt-in notice.
              </li>
            </ul>
            <p>
              If you have additional privacy requirements, please reach out at{" "}
              <a href="mailto:support@xmcp.dev">support@xmcp.dev</a>—your
              feedback directly shapes what we measure next.
            </p>
          </section>
        </DocsBody>
      </article>
    </main>
  );
}
