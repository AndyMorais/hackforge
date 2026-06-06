const baseUrl = process.env.INSFORGE_BASE_URL?.replace(/\/$/, "");
const apiKey = process.env.INSFORGE_API_KEY;

if (!baseUrl || !apiKey) {
  throw new Error("Missing INSFORGE_BASE_URL or INSFORGE_API_KEY");
}

async function runRawSql(query, params = []) {
  const response = await fetch(`${baseUrl}/api/database/advance/rawsql`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, params }),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(JSON.stringify({ status: response.status, body }, null, 2));
  }

  return body;
}

const id = `agentqa-app-mirror-test-${Date.now()}`;
const row = {
  id,
  url: "https://example.com",
  goal: "verify app mirror insert path",
  title: "App mirror insert test",
  status: "passed",
  result: "passed",
  summary: "Inserted by scripts/test-insforge-mirror.mjs",
  mainIssue: "No issue.",
  suggestedFix: "No fix needed.",
  memoryNote: "Standalone mirror insert verification.",
  previousRunId: null,
  bugs: [],
  steps: [{ action: "Insert row", observation: "Inserted through raw SQL endpoint" }],
  consoleLogs: [],
  createdAt: new Date().toISOString(),
};

await runRawSql(
  `
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
  [
    row.id,
    row.url,
    row.goal,
    row.title,
    row.status,
    row.result,
    row.summary,
    row.mainIssue,
    row.suggestedFix,
    row.memoryNote,
    row.previousRunId,
    JSON.stringify(row.bugs),
    JSON.stringify(row.steps),
    JSON.stringify(row.consoleLogs),
    row.createdAt,
  ],
);

const readback = await runRawSql(
  `
    SELECT id, url, goal, status, result
    FROM public.test_runs
    WHERE id = $1;
  `,
  [id],
);

console.log(JSON.stringify({ insertedId: id, readback }, null, 2));
