import Link from "next/link";
import { getTestRunsFromInsforge } from "@/lib/insforge/testRuns";
import { getTestRuns } from "@/lib/storage/testRuns";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const insforgeRuns = await getTestRunsFromInsforge();
  const runs = insforgeRuns ?? (await getTestRuns());

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight">Test Runs</h1>

        {runs.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-600">No test runs yet.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className="rounded-lg border border-slate-200 bg-white p-6"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Website
                    </p>
                    <p className="mt-1 truncate font-medium">{run.url}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Goal</p>
                    <p className="mt-1 font-medium">{run.goal}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Status
                    </p>
                    <p
                      className={`mt-1 font-medium ${
                        run.status === "failed"
                          ? "text-red-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {run.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Bugs</p>
                    <p className="mt-1 font-medium">{run.bugs.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Created
                    </p>
                    <p className="mt-1 font-medium">
                      {new Date(run.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Link
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  href={`/runs/${run.id}`}
                >
                  View Run
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
