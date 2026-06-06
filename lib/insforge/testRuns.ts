import { assertInsforgeConfig, getInsforgeClient, isInsforgeConfigured } from "@/lib/insforge/client";
import { env } from "@/lib/env";
import type { TestRun } from "@/lib/storage/testRuns";

export async function mirrorTestRunToInsforge(run: TestRun) {
  console.info("Attempting Insforge mirror", {
    hasBaseUrl: Boolean(process.env.INSFORGE_BASE_URL),
    hasApiKey: Boolean(process.env.INSFORGE_API_KEY),
    table: "test_runs",
  });

  try {
    assertInsforgeConfig();
    const payload = {
      id: run.id,
      url: run.url,
      goal: run.goal,
      title: run.title,
      status: run.status,
      result: run.result ?? null,
      summary: run.summary ?? null,
      mainIssue: run.mainIssue ?? null,
      suggestedFix: run.suggestedFix ?? null,
      memoryNote: run.memoryNote ?? null,
      previousRunId: run.previousRunId ?? null,
      bugs: run.bugs,
      steps: run.steps,
      consoleLogs: run.consoleLogs,
      createdAt: run.createdAt,
    };

    const response = await insertTestRunWithRawSql(payload);

    if (!response.ok) {
      console.warn("Insforge mirror failed response:", formatForLog(response));
      return;
    }

    console.info("Insforge mirror complete", { insertedId: run.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.warn(`Insforge mirror failed: ${message}`);
    console.warn("Insforge mirror error details:", formatForLog(error));
  }
}

async function insertTestRunWithRawSql(run: {
  id: string;
  url: string;
  goal: string;
  title: string;
  status: string;
  result: string | null;
  summary: string | null;
  mainIssue: string | null;
  suggestedFix: string | null;
  memoryNote: string | null;
  previousRunId: string | null;
  bugs: unknown;
  steps: unknown;
  consoleLogs: unknown;
  createdAt: string;
}) {
  const response = await fetch(
    `${env.INSFORGE_BASE_URL.replace(/\/$/, "")}/api/database/advance/rawsql`,
    {
      method: "POST",
      headers: {
        "x-api-key": env.INSFORGE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          INSERT INTO public.test_runs (
            id,
            url,
            goal,
            title,
            status,
            result,
            summary,
            "mainIssue",
            "suggestedFix",
            "memoryNote",
            "previousRunId",
            bugs,
            steps,
            "consoleLogs",
            "createdAt"
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12::jsonb,
            $13::jsonb,
            $14::jsonb,
            $15
          )
          RETURNING id;
        `,
        params: [
          run.id,
          run.url,
          run.goal,
          run.title,
          run.status,
          run.result,
          run.summary,
          run.mainIssue,
          run.suggestedFix,
          run.memoryNote,
          run.previousRunId,
          JSON.stringify(run.bugs),
          JSON.stringify(run.steps),
          JSON.stringify(run.consoleLogs),
          run.createdAt,
        ],
      }),
    },
  );
  const body = await readResponseBody(response);

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body,
  };
}

export async function getTestRunsFromInsforge() {
  if (!isInsforgeConfigured()) {
    return undefined;
  }

  try {
    const { data, error } = await getInsforgeClient()
      .database
      .from("test_runs")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      throw error;
    }

    return Array.isArray(data) ? (data as TestRun[]) : [];
  } catch (error) {
    logInsforgeMirrorError("Failed to read test runs from Insforge:", error);
    return undefined;
  }
}

export async function getTestRunFromInsforge(id: string) {
  if (!isInsforgeConfigured()) {
    return undefined;
  }

  try {
    const { data, error } = await getInsforgeClient()
      .database
      .from("test_runs")
      .select("*")
      .eq("id", id)
      .limit(1);

    if (error) {
      throw error;
    }

    return Array.isArray(data) ? ((data[0] as TestRun | undefined) ?? null) : null;
  } catch (error) {
    logInsforgeMirrorError("Failed to read test run from Insforge:", error);
    return undefined;
  }
}

function logInsforgeMirrorError(prefix: string, error: unknown) {
  if (error && typeof error === "object") {
    const propertyNames = Object.getOwnPropertyNames(error);
    const propertyValues = Object.fromEntries(
      propertyNames.map((propertyName) => [
        propertyName,
        getErrorProperty(error, propertyName),
      ]),
    );

    console.warn(prefix, {
      raw: error,
      propertyNames,
      properties: propertyValues,
      message: getErrorProperty(error, "message"),
      stack: getErrorProperty(error, "stack"),
      cause: getErrorProperty(error, "cause"),
    });
    return;
  }

  console.warn(prefix, error);
}

function getErrorProperty(error: object, propertyName: string) {
  try {
    return Reflect.get(error, propertyName) as unknown;
  } catch (propertyError) {
    return propertyError instanceof Error
      ? `Unable to read property: ${propertyError.message}`
      : "Unable to read property.";
  }
}

function formatForLog(value: unknown) {
  if (!value || typeof value !== "object") {
    return value;
  }

  return {
    json: safeJsonStringify(value),
    propertyNames: Object.getOwnPropertyNames(value),
    message: getErrorProperty(value, "message"),
    stack: getErrorProperty(value, "stack"),
    cause: getErrorProperty(value, "cause"),
    raw: value,
  };
}

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return error instanceof Error
      ? `Unable to stringify: ${error.message}`
      : "Unable to stringify.";
  }
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
