import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSlackOAuthRedirectUri } from "@/lib/slack/oauthUrl";
import { saveWorkspace } from "@/lib/storage/workspaces";

const slackOAuthAccessUrl = "https://slack.com/api/oauth.v2.access";

type SlackOAuthAccessResponse =
  | {
      ok: true;
      access_token: string;
      bot_user_id: string;
      team: {
        id: string;
        name: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

function installRedirect(request: Request, params: Record<string, string>) {
  const url = new URL("/install", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

function isSlackOAuthAccessResponse(
  value: unknown,
): value is SlackOAuthAccessResponse {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    return false;
  }

  const response = value as {
    ok?: unknown;
    error?: unknown;
    access_token?: unknown;
    bot_user_id?: unknown;
    team?: {
      id?: unknown;
      name?: unknown;
    };
  };

  if (response.ok === false) {
    return typeof response.error === "string";
  }

  return (
    response.ok === true &&
    typeof response.access_token === "string" &&
    typeof response.bot_user_id === "string" &&
    typeof response.team?.id === "string" &&
    typeof response.team.name === "string"
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return installRedirect(request, { error: "missing_code" });
  }

  const redirectUri = getSlackOAuthRedirectUri(env.NEXT_PUBLIC_APP_URL);
  const body = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    client_secret: env.SLACK_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(slackOAuthAccessUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json()) as unknown;

  if (!isSlackOAuthAccessResponse(payload)) {
    return installRedirect(request, { error: "invalid_slack_response" });
  }

  if (!payload.ok) {
    return installRedirect(request, { error: payload.error });
  }

  await saveWorkspace({
    slackTeamId: payload.team.id,
    slackTeamName: payload.team.name,
    botUserId: payload.bot_user_id,
    botAccessToken: payload.access_token,
  });

  return installRedirect(request, { success: "true" });
}
