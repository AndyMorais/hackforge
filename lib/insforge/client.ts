import { createClient } from "@insforge/sdk";
import { env } from "@/lib/env";

export const insforge = createClient({
  baseUrl: env.INSFORGE_BASE_URL,
  anonKey: env.INSFORGE_API_KEY,
});

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
