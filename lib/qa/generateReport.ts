import type { RunWebsiteTestResult } from "@/lib/qa/runWebsiteTest";

export type GeneratedReport = {
  summary: string;
  result: "passed" | "failed";
  mainIssue: string;
  suggestedFix: string;
};

export function generateReport(
  testResult: RunWebsiteTestResult,
): GeneratedReport {
  const consoleErrors = testResult.consoleLogs.filter(
    (log) => log.type === "error",
  );
  const hasBugs = testResult.bugs.length > 0;
  const result = hasBugs ? "failed" : "passed";
  const firstBug = testResult.bugs[0];
  const consoleErrorNote =
    consoleErrors.length > 0
      ? ` ${consoleErrors.length} console error${
          consoleErrors.length === 1 ? "" : "s"
        } were detected.`
      : "";

  if (!hasBugs) {
    return {
      summary: `The QA run passed for "${testResult.goal}". No bugs were detected.${consoleErrorNote}`,
      result,
      mainIssue:
        consoleErrors.length > 0
          ? "Console errors were observed, but no QA bug was recorded."
          : "No main issue detected.",
      suggestedFix:
        consoleErrors.length > 0
          ? "Review the console errors and confirm they do not affect the tested user flow."
          : "No fix needed based on this run.",
    };
  }

  return {
    summary: `The QA run failed for "${testResult.goal}" with ${testResult.bugs.length} bug${
      testResult.bugs.length === 1 ? "" : "s"
    }.${consoleErrorNote}`,
    result,
    mainIssue: firstBug
      ? `${firstBug.type}: ${firstBug.message}`
      : "A QA issue was detected.",
    suggestedFix:
      consoleErrors.length > 0
        ? "Start by fixing the reported bug and reviewing the console errors captured during the run."
        : "Review the failed step and fix the reported bug before retesting the goal.",
  };
}
