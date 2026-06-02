import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type InstalledWorkspace = {
  slackTeamId: string;
  slackTeamName: string;
  botUserId: string;
  botAccessToken: string;
  installedAt: string;
};

type SaveWorkspaceInput = Omit<InstalledWorkspace, "installedAt"> & {
  installedAt?: string;
};

const dataDir = path.join(process.cwd(), "data");
const workspacesFile = path.join(dataDir, "workspaces.json");

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(workspacesFile, "utf8");
  } catch {
    await writeFile(workspacesFile, "[]", "utf8");
  }
}

async function readWorkspaces() {
  await ensureStore();

  const fileContents = await readFile(workspacesFile, "utf8");
  const parsed = JSON.parse(fileContents) as unknown;

  return Array.isArray(parsed) ? (parsed as InstalledWorkspace[]) : [];
}

async function writeWorkspaces(workspaces: InstalledWorkspace[]) {
  await ensureStore();
  await writeFile(workspacesFile, JSON.stringify(workspaces, null, 2), "utf8");
}

export async function saveWorkspace(workspace: SaveWorkspaceInput) {
  const workspaces = await readWorkspaces();
  const savedWorkspace: InstalledWorkspace = {
    ...workspace,
    installedAt: workspace.installedAt ?? new Date().toISOString(),
  };
  const otherWorkspaces = workspaces.filter(
    (storedWorkspace) =>
      storedWorkspace.slackTeamId !== savedWorkspace.slackTeamId,
  );

  await writeWorkspaces([savedWorkspace, ...otherWorkspaces]);

  return savedWorkspace;
}

export async function getWorkspaces() {
  return readWorkspaces();
}
