import { env } from "@/lib/env";
import {
  getSlackOAuthInstallUrl,
  getSlackOAuthRedirectUri,
} from "@/lib/slack/oauthUrl";

export default function InstallPage() {
  const missingEnvVars = [
    env.SLACK_CLIENT_ID ? null : "SLACK_CLIENT_ID",
    env.NEXT_PUBLIC_APP_URL ? null : "NEXT_PUBLIC_APP_URL",
  ].filter((value): value is string => value !== null);
  const isConfigured = missingEnvVars.length === 0;
  const installUrl = isConfigured
    ? getSlackOAuthInstallUrl({
        clientId: env.SLACK_CLIENT_ID,
        appUrl: env.NEXT_PUBLIC_APP_URL,
      })
    : "";
  const redirectUri = env.NEXT_PUBLIC_APP_URL
    ? getSlackOAuthRedirectUri(env.NEXT_PUBLIC_APP_URL)
    : "/api/slack/oauth";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto w-full max-w-5xl">
        <p className="text-sm font-medium text-slate-500">Slack Setup</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Install AgentQA to Slack
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Connect AgentQA to a Slack workspace so teams can run website QA from
          a slash command. This starts Slack OAuth and redirects back to the app
          when authorization is complete.
        </p>

        {isConfigured ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Ready to Install</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">Requested scopes</dt>
                <dd className="mt-1 font-medium">commands, chat:write</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Redirect URI</dt>
                <dd className="mt-1 break-words font-medium">{redirectUri}</dd>
              </div>
            </dl>

            <a
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              href={installUrl}
            >
              Install AgentQA to Slack
            </a>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-950">
              Setup Required
            </h2>
            <p className="mt-2 text-sm text-amber-900">
              Add {missingEnvVars.join(" and ")} to .env.local before
              installing AgentQA to Slack.
            </p>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-amber-950">
                  Required scopes
                </dt>
                <dd className="mt-1 text-amber-900">commands, chat:write</dd>
              </div>
              <div>
                <dt className="font-medium text-amber-950">Redirect path</dt>
                <dd className="mt-1 break-words text-amber-900">
                  {redirectUri}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </main>
  );
}
