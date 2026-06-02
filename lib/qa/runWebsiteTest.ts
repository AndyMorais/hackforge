import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";

type RunWebsiteTestParams = {
  url: string;
  goal: string;
  runId?: string;
};

export type TestStep = {
  action: string;
  observation: string;
  screenshotPath?: string;
};

export type ConsoleLog = {
  type: "error" | "warning";
  text: string;
};

export type Bug = {
  type: "page_load" | "console" | "not_found";
  message: string;
};

type ClickCandidate = {
  index: number;
  label: string;
  score: number;
};

export type RunWebsiteTestResult = {
  url: string;
  goal: string;
  title: string;
  status: "passed" | "failed";
  steps: TestStep[];
  consoleLogs: ConsoleLog[];
  bugs: Bug[];
};

const screenshotDir = path.join(process.cwd(), "public", "screenshots");

function safeRunId(runId?: string) {
  return (runId ?? `run-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function goalTerms(goal: string) {
  return goal
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3);
}

function scoreLabel(label: string, terms: string[]) {
  const normalizedLabel = label.toLowerCase();

  return terms.filter((term) => normalizedLabel.includes(term)).length;
}

async function takeScreenshot(page: Page, runId: string, name: string) {
  await mkdir(screenshotDir, { recursive: true });

  const fileName = `${runId}-${name}.png`;
  const filePath = path.join(screenshotDir, fileName);

  await page.screenshot({ path: filePath, fullPage: true });

  return `/screenshots/${fileName}`;
}

async function hasNotFoundText(page: Page) {
  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(
    () => "",
  );

  return /\b(404|not found|page not found)\b/i.test(bodyText);
}

async function findClickCandidate(
  page: Page,
  terms: string[],
  clickedLabels: Set<string>,
) {
  const elements = page.locator(
    'a, button, [role="button"], input[type="button"], input[type="submit"]',
  );
  const count = await elements.count();
  const candidates: ClickCandidate[] = [];

  for (let index = 0; index < count; index += 1) {
    const element = elements.nth(index);
    const isVisible = await element.isVisible().catch(() => false);

    if (!isVisible) {
      continue;
    }

    const text = await element.innerText({ timeout: 1000 }).catch(() => "");
    const ariaLabel = await element.getAttribute("aria-label").catch(() => "");
    const value = await element.getAttribute("value").catch(() => "");
    const href = await element.getAttribute("href").catch(() => "");
    const label = (text || ariaLabel || value || href || "").trim();
    const normalizedLabel = label.toLowerCase();

    if (!label || clickedLabels.has(normalizedLabel)) {
      continue;
    }

    candidates.push({
      index,
      label,
      score: scoreLabel(label, terms),
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates.find((candidate) => candidate.score > 0) ?? null;
}

export async function runWebsiteTest({
  url,
  goal,
  runId,
}: RunWebsiteTestParams): Promise<RunWebsiteTestResult> {
  const browser: Browser = await chromium.launch();
  const safeId = safeRunId(runId);
  const steps: TestStep[] = [];
  const consoleLogs: ConsoleLog[] = [];
  const bugs: Bug[] = [];
  let title = "";

  try {
    const page = await browser.newPage();

    page.on("console", (message) => {
      const type = message.type();

      if (type === "error" || type === "warning") {
        consoleLogs.push({ type, text: message.text() });
      }
    });

    const response = await page
      .goto(url, { waitUntil: "domcontentloaded", timeout: 15000 })
      .catch((error: unknown) => {
        bugs.push({
          type: "page_load",
          message: `Page failed to load: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });

        return null;
      });

    if (response && !response.ok()) {
      bugs.push({
        type: "page_load",
        message: `Page loaded with HTTP status ${response.status()}.`,
      });
    }

    title = await page.title().catch(() => "");

    steps.push({
      action: `Open ${url}`,
      observation: title ? `Loaded page titled "${title}".` : "Loaded page.",
      screenshotPath: await takeScreenshot(page, safeId, "initial"),
    });

    const terms = goalTerms(goal);
    const clickedLabels = new Set<string>();

    for (let clickNumber = 1; clickNumber <= 3; clickNumber += 1) {
      const candidate = await findClickCandidate(page, terms, clickedLabels);

      if (!candidate) {
        steps.push({
          action: "Find goal-related control",
          observation: "No visible button or link matched the goal text.",
        });
        break;
      }

      clickedLabels.add(candidate.label.toLowerCase());

      const elements = page.locator(
        'a, button, [role="button"], input[type="button"], input[type="submit"]',
      );
      const element = elements.nth(candidate.index);

      await element.click({ timeout: 5000 }).catch((error: unknown) => {
        steps.push({
          action: `Click "${candidate.label}"`,
          observation: `Click failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      });
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(
        () => undefined,
      );

      const screenshotPath = await takeScreenshot(
        page,
        safeId,
        `click-${clickNumber}`,
      );
      const notFound = await hasNotFoundText(page);

      if (notFound) {
        bugs.push({
          type: "not_found",
          message: `Clicking "${candidate.label}" led to a 404 or not found page.`,
        });
      }

      steps.push({
        action: `Click "${candidate.label}"`,
        observation: notFound
          ? "Page shows 404 or not found text."
          : `Clicked visible control related to goal term match score ${candidate.score}.`,
        screenshotPath,
      });
    }

    if (consoleLogs.some((log) => log.type === "error")) {
      bugs.push({
        type: "console",
        message: "Console errors were detected during the test.",
      });
    }

    return {
      url,
      goal,
      title,
      status: bugs.length > 0 ? "failed" : "passed",
      steps,
      consoleLogs,
      bugs,
    };
  } finally {
    await browser.close();
  }
}
