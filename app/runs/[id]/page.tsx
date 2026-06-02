import { getTestRunFromInsforge } from "@/lib/insforge/testRuns";
import { getTestRunById } from "@/lib/storage/testRuns";

type RunDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;
  const insforgeRun = await getTestRunFromInsforge(id);
  const run = insforgeRun === undefined ? await getTestRunById(id) : insforgeRun;

  if (!run) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
        <section className="mx-auto w-full max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            Run not found.
          </h1>
        </section>
      </main>
    );
  }

  const screenshotSteps = run.steps.filter((step) => step.screenshotPath);
  const summary =
    run.summary ??
    `${run.status === "failed" ? "The QA run failed" : "The QA run passed"} for "${run.goal}".`;
  const mainIssue =
    run.mainIssue ??
    (run.bugs[0]
      ? `${run.bugs[0].type}: ${run.bugs[0].message}`
      : "No main issue detected.");
  const suggestedFix =
    run.suggestedFix ??
    (run.bugs.length > 0
      ? "Review the reported bug and retest the goal."
      : "No fix needed based on this run.");

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto w-full max-w-5xl">
        <p className="text-sm font-medium text-slate-500">Test Run</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {run.title || "Untitled Page"}
        </h1>

        <div className="mt-8 grid gap-4">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Summary</h2>
            <p className="mt-2 text-sm text-slate-600">{summary}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Website</p>
                <p className="mt-1 break-words font-medium">{run.url}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Goal</p>
                <p className="mt-1 font-medium">{run.goal}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <p className="mt-1 font-medium">{run.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Created</p>
                <p className="mt-1 font-medium">
                  {new Date(run.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Report</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Main Issue
                </p>
                <p className="mt-1 text-sm text-slate-700">{mainIssue}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Suggested Fix
                </p>
                <p className="mt-1 text-sm text-slate-700">{suggestedFix}</p>
              </div>
            </div>
          </section>

          {run.memoryNote ? (
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold">QA Memory</h2>
              <p className="mt-2 text-sm text-slate-600">{run.memoryNote}</p>
              {run.previousRunId ? (
                <p className="mt-2 text-sm text-slate-500">
                  Previous run: {run.previousRunId}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Bugs</h2>
            {run.bugs.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No bugs detected.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {run.bugs.map((bug, index) => (
                  <li key={`${bug.type}-${index}`} className="text-sm">
                    <span className="font-medium">{bug.type}:</span>{" "}
                    {bug.message}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Screenshot Timeline</h2>
            {screenshotSteps.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No screenshots captured.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {screenshotSteps.map((step) => (
                  <a
                    key={step.screenshotPath}
                    className="block overflow-hidden rounded-lg border border-slate-200"
                    href={step.screenshotPath}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={step.action}
                      className="h-56 w-full object-cover"
                      src={step.screenshotPath}
                    />
                    <p className="p-3 text-sm font-medium">{step.action}</p>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Steps</h2>
            <ol className="mt-4 space-y-4">
              {run.steps.map((step, index) => (
                <li key={`${step.action}-${index}`} className="text-sm">
                  <p className="font-medium">
                    {index + 1}. {step.action}
                  </p>
                  <p className="mt-1 text-slate-600">{step.observation}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Console Logs</h2>
            {run.consoleLogs.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No console warnings or errors.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {run.consoleLogs.map((log, index) => (
                  <li key={`${log.type}-${index}`} className="text-sm">
                    <span className="font-medium">{log.type}:</span> {log.text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
