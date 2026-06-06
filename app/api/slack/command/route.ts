import { after } from "next/server";
import { env } from "@/lib/env";
import type { TestRun } from "@/lib/storage/testRuns";

export const maxDuration = 60;

type SlackCommandPayload = {
  text: string;
  userId: string;
  channelId: string;
  teamId: string;
  responseUrl: string;
};

type SlackResponse = {
  response_type: "in_channel" | "ephemeral";
  text: string;
  blocks?: SlackBlock[];
};

type SlackBlock =
  | {
      type: "header";
      text: {
        type: "plain_text";
        text: string;
        emoji?: boolean;
      };
    }
  | {
      type: "section";
      text?: {
        type: "mrkdwn";
        text: string;
      };
      fields?: {
        type: "mrkdwn";
        text: string;
      }[];
    }
  | {
      type: "actions";
      elements: {
        type: "button";
        text: {
          type: "plain_text";
          text: string;
          emoji?: boolean;
        };
        url: string;
      }[];
    }
  | {
      type: "divider";
    };

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function parseCommandText(text: string) {
  const [url = "", ...goalParts] = text.trim().split(/\s+/);
  const goal = goalParts.join(" ").trim();

  return { url, goal };
}

function createRunId() {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function runResult(run: TestRun) {
  return run.result ?? run.status;
}

function getMemoryNote(previousRun: TestRun | null, currentResult: TestRun) {
  if (!previousRun) {
    return "QA Memory: No previous matching run found.";
  }

  const previousResult = runResult(previousRun);
  const result = runResult(currentResult);

  if (previousResult === "passed" && result === "failed") {
    return "QA Memory: Regression detected — this test passed last time but failed now.";
  }

  if (previousResult === "failed" && result === "passed") {
    return "QA Memory: Improvement detected — this test failed last time but passed now.";
  }

  return "QA Memory: Same result as last run.";
}

function escapeSlackText(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getReportBaseUrl(request: Request) {
  const configuredAppUrl = env.NEXT_PUBLIC_APP_URL.trim();

  return configuredAppUrl || new URL(request.url).origin;
}

function getSlackResultBlocks({
  bugsFound,
  goal,
  isFailed,
  mainIssue,
  memoryNote,
  reportUrl,
  suggestedFix,
  url,
}: {
  bugsFound: number;
  goal: string;
  isFailed: boolean;
  mainIssue: string;
  memoryNote: string;
  reportUrl: string;
  suggestedFix: string;
  url: string;
}): SlackBlock[] {
  const title = isFailed ? "🚨 QA Test Failed" : "✅ QA Test Passed";
  const severity = isFailed ? "High" : "None";
  const whatBroke = isFailed ? mainIssue : "No major issues found.";

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: title,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Severity:*\n${escapeSlackText(severity)}`,
        },
        {
          type: "mrkdwn",
          text: `*Bugs found:*\n${bugsFound}`,
        },
        {
          type: "mrkdwn",
          text: `*URL:*\n${escapeSlackText(url)}`,
        },
        {
          type: "mrkdwn",
          text: `*Goal:*\n${escapeSlackText(goal)}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Main issue:*\n${escapeSlackText(whatBroke)}\n\n*${escapeSlackText(
          memoryNote,
        )}*`,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: [
          "*Dev Handoff*",
          `*What broke:* ${escapeSlackText(whatBroke)}`,
          `*Where it happened:* ${escapeSlackText(url)} while testing "${escapeSlackText(
            goal,
          )}"`,
          `*Suggested first check:* ${escapeSlackText(suggestedFix)}`,
        ].join("\n"),
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Open Full Report",
            emoji: true,
          },
          url: reportUrl,
        },
      ],
    },
  ];
}

async function runQaAndPostResult({
  appUrl,
  goal,
  responseUrl,
  url,
}: {
  appUrl: string;
  goal: string;
  responseUrl: string;
  url: string;
}) {
  console.log("Background QA started");

  try {
    const [
      { mirrorTestRunToInsforge },
      { generateReport },
      { runWebsiteTest },
      {
        getPreviousRunForSameTest,
        saveTestRun,
        updateTestRunMemory,
      },
    ] = await Promise.all([
      import("@/lib/insforge/testRuns"),
      import("@/lib/qa/generateReport"),
      import("@/lib/qa/runWebsiteTest"),
      import("@/lib/storage/testRuns"),
    ]);
    const testResult = await runWebsiteTest({ url, goal });
    const report = generateReport(testResult);
    const runId = createRunId();
    const createdAt = new Date().toISOString();
    let savedRun: TestRun = {
      id: runId,
      url: testResult.url,
      goal: testResult.goal,
      title: testResult.title,
      status: testResult.status,
      steps: testResult.steps,
      bugs: testResult.bugs,
      consoleLogs: testResult.consoleLogs,
      summary: report.summary,
      result: report.result,
      mainIssue: report.mainIssue,
      suggestedFix: report.suggestedFix,
      createdAt,
    };

    try {
      savedRun = await saveTestRun({
        ...testResult,
        ...report,
        id: runId,
        createdAt,
      });
    } catch (saveError) {
      console.warn("Local QA run save skipped.", saveError);
    }

    let previousRun: TestRun | null = null;

    try {
      previousRun = await getPreviousRunForSameTest(
        savedRun.url,
        savedRun.goal,
        savedRun.id,
      );
    } catch (memoryError) {
      console.warn("QA Memory lookup skipped.", memoryError);
    }

    const memoryNote = getMemoryNote(previousRun, savedRun);
    let runForResponse: TestRun = {
      ...savedRun,
      previousRunId: previousRun?.id,
      memoryNote,
    };

    try {
      const completedRun = await updateTestRunMemory(savedRun.id, {
        previousRunId: previousRun?.id,
        memoryNote,
      });

      runForResponse = completedRun ?? runForResponse;
    } catch (memoryError) {
      console.warn("QA Memory update skipped.", memoryError);
    }

    await mirrorTestRunToInsforge(runForResponse);

    const reportUrl = `${appUrl.replace(/\/$/, "")}/runs/${runForResponse.id}`;
    const isFailed = report.result === "failed";
    const status = isFailed ? "Failed" : "Passed";
    const mainIssue =
      testResult.bugs.length === 0 ? "No major issues found." : report.mainIssue;
    const fallbackText = [
      isFailed ? "🚨 QA Test Failed" : "✅ QA Test Passed",
      `Status: ${status}`,
      `Bugs found: ${testResult.bugs.length}`,
      `Main issue: ${mainIssue}`,
      memoryNote,
      `Report: ${reportUrl}`,
    ].join("\n");

    await postSlackResponse(responseUrl, {
      response_type: "in_channel",
      text: fallbackText,
      blocks: getSlackResultBlocks({
        bugsFound: testResult.bugs.length,
        goal: testResult.goal,
        isFailed,
        mainIssue,
        memoryNote,
        reportUrl,
        suggestedFix: report.suggestedFix,
        url: testResult.url,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await postSlackResponse(responseUrl, {
      response_type: "in_channel",
      text: `QA test failed to complete. ${message}`,
    });
  } finally {
    console.log("Background QA finished");
  }
}

async function postSlackResponse(responseUrl: string, payload: SlackResponse) {
  if (!responseUrl) {
    console.warn("Slack response_url missing; unable to post QA result.");
    return;
  }

  const response = await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.warn("Failed to post Slack response.", {
      status: response.status,
      statusText: response.statusText,
      body: await response.text(),
    });
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload: SlackCommandPayload = {
    text: getFormValue(formData, "text"),
    userId: getFormValue(formData, "user_id"),
    channelId: getFormValue(formData, "channel_id"),
    teamId: getFormValue(formData, "team_id"),
    responseUrl: getFormValue(formData, "response_url"),
  };
  const { url, goal } = parseCommandText(payload.text);

  console.log("Slack command received");

  if (!url || !goal) {
    return Response.json({
      response_type: "ephemeral",
      text: "Use this format: /qa-test https://example.com test signup flow",
    });
  }

  const appUrl = getReportBaseUrl(request);

  after(() => {
    void runQaAndPostResult({
      appUrl,
      goal,
      responseUrl: payload.responseUrl,
      url,
    });
  });

  console.log("Immediate Slack response sent");

  return Response.json({
    response_type: "in_channel",
    text: `QA test started for ${url}. I’ll post the report here when it’s done.`,
  });
}
