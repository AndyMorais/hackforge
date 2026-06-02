const slackAuthorizeUrl = "https://slack.com/oauth/v2/authorize";
const slackScopes = ["commands", "chat:write"] as const;

type SlackOAuthUrlParams = {
  clientId: string;
  appUrl: string;
};

export function getSlackOAuthRedirectUri(appUrl: string) {
  return `${appUrl.replace(/\/$/, "")}/api/slack/oauth`;
}

export function getSlackOAuthInstallUrl({
  clientId,
  appUrl,
}: SlackOAuthUrlParams) {
  const url = new URL(slackAuthorizeUrl);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", slackScopes.join(","));
  url.searchParams.set("redirect_uri", getSlackOAuthRedirectUri(appUrl));

  return url.toString();
}
