import { defineCommand } from "citty";
import { runCommand } from "./run";
import { resolveBranchCommand } from "./resolve-branch";
import { bootstrapCommand } from "./bootstrap";
import { fetchLearningsCommand } from "./fetch-learnings";
import { promoteLearningsCommand } from "./promote-learnings";

export const actionCommand = defineCommand({
  meta: {
    name: "action",
    description: "GitHub Action commands — run workflows, bootstrap, manage learnings",
  },
  subCommands: {
    run: runCommand,
    "resolve-branch": resolveBranchCommand,
    bootstrap: bootstrapCommand,
    "fetch-learnings": fetchLearningsCommand,
    "promote-learnings": promoteLearningsCommand,
  },
});
