import { describe, test, expect, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { clearStaleState, setupGitExclude } from "./bootstrap";

let tempDir: string;
function makeTempDir(): string {
  tempDir = mkdtempSync(join(tmpdir(), "jdi-test-"));
  return tempDir;
}

afterEach(() => {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
});

describe("clearStaleState", () => {
  test("removes plans and writes fresh state.yaml", () => {
    const cwd = makeTempDir();
    const plansDir = join(cwd, ".jdi/plans");
    mkdirSync(plansDir, { recursive: true });
    writeFileSync(join(plansDir, "old-plan.md"), "old plan content");
    writeFileSync(join(plansDir, "old-plan.T1.md"), "old task content");

    clearStaleState(cwd);

    // Plans directory should be empty
    const remaining = readdirSync(plansDir);
    expect(remaining).toHaveLength(0);

    // state.yaml should have fresh content
    const statePath = join(cwd, ".jdi/config/state.yaml");
    expect(existsSync(statePath)).toBe(true);
    const content = readFileSync(statePath, "utf-8");
    expect(content).toBe("active_plan: null\ncurrent_wave: null\nmode: null\n");
  });

  test("works when plans directory does not exist yet", () => {
    const cwd = makeTempDir();
    mkdirSync(join(cwd, ".jdi"), { recursive: true });

    clearStaleState(cwd);

    // Plans directory should have been created (empty)
    expect(existsSync(join(cwd, ".jdi/plans"))).toBe(true);

    // state.yaml should exist
    const statePath = join(cwd, ".jdi/config/state.yaml");
    expect(existsSync(statePath)).toBe(true);
  });
});

describe("setupGitExclude", () => {
  test("adds .jdi/ and .claude/ entries to exclude file", () => {
    const cwd = makeTempDir();
    mkdirSync(join(cwd, ".git/info"), { recursive: true });

    setupGitExclude(cwd);

    const content = readFileSync(join(cwd, ".git/info/exclude"), "utf-8");
    expect(content).toContain(".jdi/");
    expect(content).toContain(".claude/");
  });

  test("is idempotent — running twice does not duplicate entries", () => {
    const cwd = makeTempDir();
    mkdirSync(join(cwd, ".git/info"), { recursive: true });

    setupGitExclude(cwd);
    setupGitExclude(cwd);

    const content = readFileSync(join(cwd, ".git/info/exclude"), "utf-8");
    const jdiMatches = content.split("\n").filter((l) => l === ".jdi/");
    const claudeMatches = content.split("\n").filter((l) => l === ".claude/");
    expect(jdiMatches).toHaveLength(1);
    expect(claudeMatches).toHaveLength(1);
  });

  test("preserves existing exclude content", () => {
    const cwd = makeTempDir();
    mkdirSync(join(cwd, ".git/info"), { recursive: true });
    writeFileSync(join(cwd, ".git/info/exclude"), "node_modules/\n");

    setupGitExclude(cwd);

    const content = readFileSync(join(cwd, ".git/info/exclude"), "utf-8");
    expect(content).toContain("node_modules/");
    expect(content).toContain(".jdi/");
    expect(content).toContain(".claude/");
  });
});
