import { describe, expect, it } from "vitest";
import { listSlugs, readDoc } from "@/lib/content/read";

describe("content read seam", () => {
  it("rejects a slug that was never in the allow-list, including traversal attempts", () => {
    expect(() => readDoc("docs", "../../../../etc/passwd")).toThrow(
      /Unknown docs slug/,
    );
    expect(() => readDoc("intent", "../../../../etc/passwd")).toThrow(
      /Unknown intent slug/,
    );
  });

  it("resolves a real slug built from what is actually on disk", () => {
    const slugs = listSlugs("intent");
    expect(slugs).toContain("nextjs-project-baseline/plan");

    const doc = readDoc("intent", "nextjs-project-baseline/plan");
    expect(doc.content).toContain("# Plan: `nextjs-project-baseline`");
  });
});
