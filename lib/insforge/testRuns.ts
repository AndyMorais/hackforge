import {
  assertInsforgeConfig,
  insforge,
  isInsforgeConfigured,
} from "@/lib/insforge/client";
import type { TestRun } from "@/lib/storage/testRuns";

export async function mirrorTestRunToInsforge(run: TestRun) {
  try {
    assertInsforgeConfig();

    const { error } = await insforge.database.from("test_runs").insert([run]);

    if (error) {
      throw error;
    }
  } catch (error) {
    logInsforgeMirrorError("Failed to mirror test run to Insforge:", error);
  }
}

export async function getTestRunsFromInsforge() {
  if (!isInsforgeConfigured()) {
    return undefined;
  }

  try {
    const { data, error } = await insforge.database
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
    const { data, error } = await insforge.database
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
