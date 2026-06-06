import { createAdminClient } from "@insforge/sdk";
import { env } from "@/lib/env";

let insforgeClient: ReturnType<typeof createAdminClient> | undefined;

export function isInsforgeConfigured() {
  return Boolean(env.INSFORGE_BASE_URL && env.INSFORGE_API_KEY);
}

export function assertInsforgeConfig() {
  if (!isInsforgeConfigured()) {
    throw new Error(
      "Missing Insforge configuration. Add INSFORGE_BASE_URL and INSFORGE_API_KEY to .env.local.",
    );
  }
}

export function getInsforgeClient() {
  assertInsforgeConfig();
  insforgeClient ??= createAdminClient({
    baseUrl: env.INSFORGE_BASE_URL,
    apiKey: env.INSFORGE_API_KEY,
  });

  return insforgeClient;
}
