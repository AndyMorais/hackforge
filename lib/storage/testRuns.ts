import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Bug,
  ConsoleLog,
  RunWebsiteTestResult,
  TestStep,
} from "@/lib/qa/runWebsiteTest";
import type { GeneratedReport } from "@/lib/qa/generateReport";

export type TestRun = {
  id: string;
  url: string;
  goal: string;
  title: string;
  status: "passed" | "failed";
  steps: TestStep[];
  bugs: Bug[];
  consoleLogs: ConsoleLog[];
  summary?: string;
  result?: GeneratedReport["result"];
  mainIssue?: string;
  suggestedFix?: string;
  previousRunId?: string;
  memoryNote?: string;
  createdAt: string;
};

type SaveTestRunInput = RunWebsiteTestResult &
  GeneratedReport & {
  id?: string;
  createdAt?: string;
  previousRunId?: string;
  memoryNote?: string;
};

const dataDir = path.join(process.cwd(), "data");
const testRunsFile = path.join(dataDir, "test-runs.json");

function createRunId() {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(testRunsFile, "utf8");
  } catch {
    await writeFile(testRunsFile, "[]", "utf8");
  }
}

async function readRuns() {
  await ensureStore();

  const fileContents = await readFile(testRunsFile, "utf8");
  const parsed = JSON.parse(fileContents) as unknown;

  return Array.isArray(parsed) ? (parsed as TestRun[]) : [];
}

async function writeRuns(runs: TestRun[]) {
  await ensureStore();
  await writeFile(testRunsFile, JSON.stringify(runs, null, 2), "utf8");
}

export async function saveTestRun(run: SaveTestRunInput) {
  const runs = await readRuns();
  const savedRun: TestRun = {
    id: run.id ?? createRunId(),
    url: run.url,
    goal: run.goal,
    title: run.title,
    status: run.status,
    steps: run.steps,
    bugs: run.bugs,
    consoleLogs: run.consoleLogs,
    summary: run.summary,
    result: run.result,
    mainIssue: run.mainIssue,
    suggestedFix: run.suggestedFix,
    previousRunId: run.previousRunId,
    memoryNote: run.memoryNote,
    createdAt: run.createdAt ?? new Date().toISOString(),
  };

  await writeRuns([savedRun, ...runs]);

  return savedRun;
}

export async function getTestRuns() {
  return readRuns();
}

export async function getTestRunById(id: string) {
  const runs = await readRuns();

  return runs.find((run) => run.id === id) ?? null;
}

export async function getPreviousRunForSameTest(
  url: string,
  goal: string,
  excludeRunId: string,
) {
  const runs = await readRuns();

  return (
    runs
      .filter(
        (run) =>
          run.id !== excludeRunId && run.url === url && run.goal === goal,
      )
      .sort(
        (firstRun, secondRun) =>
          new Date(secondRun.createdAt).getTime() -
          new Date(firstRun.createdAt).getTime(),
      )[0] ?? null
  );
}

export async function updateTestRunMemory(
  id: string,
  memory: { previousRunId?: string; memoryNote: string },
) {
  const runs = await readRuns();
  const updatedRuns = runs.map((run) =>
    run.id === id
      ? {
          ...run,
          previousRunId: memory.previousRunId,
          memoryNote: memory.memoryNote,
        }
      : run,
  );

  await writeRuns(updatedRuns);

  return updatedRuns.find((run) => run.id === id) ?? null;
}
