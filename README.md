# AgentQA

AgentQA is a Slack-native AI QA agent for running quick website tests from a Slack channel. The current local-first version runs with Slack, Playwright, and Insforge configured through environment variables.

Users run `/qa-test` with a website URL and a goal. AgentQA opens the site with Playwright, checks the flow, captures screenshots and console logs, generates a QA report, and saves the run as QA Memory.

## Problem

Small teams often find bugs in Slack but lose the details needed for a useful developer handoff. Screenshots, console errors, reproduction context, and historical QA results end up scattered across threads or not saved at all.

## Solution

AgentQA turns Slack into a lightweight QA command center. A teammate can ask AgentQA to test a specific website flow, then get a structured result back in the channel with a full dashboard report link.

## How It Works

1. Run `/qa-test https://example.com test signup flow` in Slack.
2. AgentQA runs a Playwright browser test against the URL and goal.
3. The app captures screenshots, steps, bugs, and console logs.
4. AgentQA generates a simple report with status, main issue, and suggested fix.
5. The run is saved locally as QA Memory and mirrored to Insforge.
6. The Slack response includes a developer handoff and link to the full report.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Slack API and Slack OAuth
- Playwright
- Insforge
- Local JSON storage as backup

## Core Features

- Slack slash command: `/qa-test`
- Website QA runs powered by Playwright
- Screenshot capture for each run
- Console warning/error collection
- Bug detection for load failures, 404/not found flows, and console errors
- QA report generation
- Slack Block Kit result messages
- Web dashboard for saved runs
- QA Memory comparison against previous matching runs
- Insforge mirroring for persisted test run data

## Insforge Role

Insforge stores mirrored QA Memory records in the `test_runs` table. The local JSON files still act as a backup, but the dashboard reads from Insforge first when it is configured. This means deleting a test run from Insforge removes it from the dashboard view.

## Local Setup

Install dependencies:

```bash
npm install
```

Install Playwright browsers if needed:

```bash
npx playwright install
```

Create `.env.local`:

```bash
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
INSFORGE_BASE_URL=
INSFORGE_API_KEY=
```

Run the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

- `SLACK_SIGNING_SECRET`: Slack app signing secret.
- `SLACK_BOT_TOKEN`: Slack bot token used for Slack API access if needed.
- `SLACK_CLIENT_ID`: Slack OAuth client ID.
- `SLACK_CLIENT_SECRET`: Slack OAuth client secret.
- `NEXT_PUBLIC_APP_URL`: Public app URL used for Slack redirects and report links.
- `INSFORGE_BASE_URL`: Insforge backend URL.
- `INSFORGE_API_KEY`: Insforge API key.

Do not commit real secret values.

## Slack Setup Notes

- Create a Slack app in the Slack API dashboard.
- Add a slash command, for example `/qa-test`.
- Point the command request URL to:

```text
https://your-public-app-url.com/api/slack/command
```

- Configure OAuth redirect URL:

```text
https://your-public-app-url.com/api/slack/oauth
```

- Required OAuth scopes:
  - `commands`
  - `chat:write`

- Use `/install` in the app to start the Slack install flow.

For local development, use a public tunnel URL such as Cloudflare Tunnel and set `NEXT_PUBLIC_APP_URL` to that public URL.

AgentQA is currently intended to run locally while connected to a Slack app and Insforge project. Production hardening is still in progress.

## Current Limitations

- The report generator uses simple rule-based logic, not a real LLM call yet.
- Playwright goal matching is basic and may not fully understand complex flows.
- Local JSON storage is a backup, not a production database.
- Insforge table/schema management is not automated in this app.
- Dashboard access control and broader production hardening are still in progress.
- The early version is intended for local development workflows, not production QA coverage.
