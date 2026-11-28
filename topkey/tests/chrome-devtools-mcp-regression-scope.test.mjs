import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Vendored tools and generated staging output are excluded from source scans", () => {
  const workflow = readFileSync(
    new URL("../../.github/workflows/topkey-chrome-devtools-mcp.yml", import.meta.url),
    "utf8",
  );

  const scanCommands = workflow
    .split("\n")
    .filter((line) => line.includes("find . -type d") && line.includes("-prune"));

  assert.equal(
    scanCommands.length,
    3,
    "syntax, Node test discovery, and Python compile scans must all share the same exclusion policy",
  );

  for (const command of scanCommands) {
    assert.match(
      command,
      /-name \.tools.*-name dist-edgeone.*\) -prune/,
      `third-party MCP checkout and generated EdgeOne output must be pruned from scan: ${command.trim()}`,
    );
  }
});
