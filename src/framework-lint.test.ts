import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const frameworkRoot = join(import.meta.dir, "..", "framework");

function readFrameworkFile(relativePath: string): string {
  const fullPath = join(frameworkRoot, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Framework file not found: ${relativePath} (expected at ${fullPath})`);
  }
  return readFileSync(fullPath, "utf-8");
}

describe("framework file invariants", () => {
  test("agents/jdi-planner.md contains required directives", () => {
    const content = readFrameworkFile("agents/jdi-planner.md");

    // Must have sandbox override directive (case-sensitive — specific directive)
    expect(content).toContain("SANDBOX OVERRIDE");

    // Must reference split format
    expect(content).toMatch(/split format|SPLIT FORMAT/i);

    // Must reference task files (T{n}.md pattern or "task file")
    expect(content).toMatch(/T\{?\d*n?\d*\}?\.md|task.file/i);

    // Must reference task_files frontmatter key
    expect(content).toContain("task_files");
  });

  test("commands/create-plan.md references split format", () => {
    const content = readFrameworkFile("commands/create-plan.md");

    // Must reference split or task file
    expect(content).toMatch(/split|task.file/i);

    // Must NOT say "creates PLAN.md" (monolithic format)
    expect(content).not.toContain("creates PLAN.md");
  });

  test("commands/implement-plan.md references task files", () => {
    const content = readFrameworkFile("commands/implement-plan.md");
    expect(content).toMatch(/task_files|task.file|split.plan/i);
  });

  test("templates/PLAN.md contains task_files frontmatter", () => {
    const content = readFrameworkFile("templates/PLAN.md");
    expect(content).toContain("task_files:");
  });

  test("templates/PLAN-TASK.md exists and has task_id", () => {
    const fullPath = join(frameworkRoot, "templates/PLAN-TASK.md");
    expect(existsSync(fullPath)).toBe(true);

    const content = readFrameworkFile("templates/PLAN-TASK.md");
    expect(content).toContain("task_id");
  });

  test("agents/jdi-backend.md references learnings", () => {
    const content = readFrameworkFile("agents/jdi-backend.md");
    expect(content).toMatch(/learnings/i);
  });

  test("agents/jdi-frontend.md references learnings", () => {
    const content = readFrameworkFile("agents/jdi-frontend.md");
    expect(content).toMatch(/learnings/i);
  });

  test("components/meta/ComplexityRouter.md references task files", () => {
    const content = readFrameworkFile("components/meta/ComplexityRouter.md");
    expect(content).toMatch(/TASK_FILE|task.file|task_file/i);
  });
});
