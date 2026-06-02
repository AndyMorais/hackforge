import Link from "next/link";
import type { ReactNode } from "react";

const valueProps = [
  {
    title: "No test scripts needed",
    description:
      "Describe a URL and goal in Slack. The agent explores the site and reports what it finds.",
  },
  {
    title: "Bugs where your team already works",
    description:
      "QA results land in Slack so founders, PMs, and developers can find, discuss, and fix issues together.",
  },
  {
    title: "Proof developers can act on",
    description:
      "Every run includes screenshots, logs, and steps so fixes start with context, not guesswork.",
  },
  {
    title: "QA Memory in Insforge",
    description:
      "Every run is saved so teams can compare results, spot regressions, and track quality over time.",
  },
] as const;

const steps = [
  {
    step: "1",
    title: "Run /qa-test in Slack",
    description:
      "Share a website URL and what you want checked. AgentQA picks up the job from your workspace.",
  },
  {
    step: "2",
    title: "Agent tests and captures proof",
    description:
      "Playwright runs the site, records screenshots and logs, and posts findings back to the channel.",
  },
  {
    step: "3",
    title: "Open the QA Memory report",
    description:
      "Your dev team reviews the saved run with full context in Insforge and ships fixes faster.",
  },
] as const;

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.8125rem] font-medium tracking-[0.02em] text-stone-500">
      {children}
    </p>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-14 sm:py-20">
      <div
        className="home-glow pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-black/5 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-40 h-64 w-64 rounded-full bg-stone-300/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-5xl">
        {/* Hero */}
        <section className="max-w-2xl">
          <span className="animate-fade-up delay-1 inline-flex items-center rounded-full border border-black/10 bg-white/80 px-4 py-1.5 text-[0.8125rem] font-medium text-stone-800">
            Slack-native AI QA
          </span>

          <h1 className="font-display animate-fade-up delay-2 mt-6 text-[3.25rem] font-semibold leading-[1.05] tracking-[-0.03em] text-stone-900 sm:text-7xl">
            AgentQA
          </h1>

          <p className="font-display animate-fade-up delay-3 mt-5 text-2xl font-medium leading-snug tracking-[-0.02em] text-stone-800 sm:text-[2rem]">
            Deploy QA agents from Slack.
          </p>

          <p className="animate-fade-up delay-4 mt-6 max-w-xl text-[1.0625rem] leading-[1.75] text-stone-600">
            Run website QA tests directly from Slack, share bugs with your dev
            team instantly, and save every run as QA Memory in Insforge.
          </p>

          <div className="animate-fade-up delay-5 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              className="btn-primary inline-flex h-12 items-center justify-center px-7 text-sm font-semibold text-white"
              href="/runs"
            >
              View Runs
            </Link>
            <Link
              className="btn-secondary inline-flex h-12 items-center justify-center px-7 text-sm font-semibold text-stone-800"
              href="/install"
            >
              Install Slack App
            </Link>
          </div>
        </section>

        {/* Value */}
        <section className="mt-24 sm:mt-28">
          <SectionLabel>Why teams use AgentQA</SectionLabel>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {valueProps.map((item, index) => (
              <div
                key={item.title}
                className="home-card animate-fade-up p-7 sm:p-8"
                style={{ animationDelay: `${0.28 + index * 0.06}s` }}
              >
                <span
                  className="mb-4 inline-block h-1.5 w-8 rounded-full bg-stone-900/80"
                  aria-hidden
                />
                <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-stone-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-24 sm:mt-28">
          <SectionLabel>How it works</SectionLabel>
          <ol className="mt-5 grid gap-4 lg:grid-cols-3">
            {steps.map((item, index) => (
              <li
                key={item.step}
                className="home-card animate-fade-up p-7 sm:p-8"
                style={{ animationDelay: `${0.52 + index * 0.08}s` }}
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-sm font-semibold text-white shadow-sm shadow-black/20"
                  aria-hidden
                >
                  {item.step}
                </span>
                <h3 className="font-display mt-5 text-lg font-semibold tracking-[-0.02em] text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-stone-600">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
