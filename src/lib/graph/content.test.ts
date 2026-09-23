import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadNodeContent,
  resolveNodeContent,
  type ContentFile,
} from "@/lib/graph/content";
import {
  FIXTURE_CONTENT_DIR,
  fixtureSeed,
} from "@/lib/graph/__fixtures__/seed";
import { seed } from "@/lib/graph/seed";
import { flatten } from "@/lib/graph/tree";
import type { GraphSeed } from "@/lib/graph/types";

const tree: GraphSeed = {
  name: "AI",
  children: [
    {
      name: "n Node",
      children: [
        { name: "RAG", children: [{ name: "Vector db" }] },
        { name: "Evals" },
      ],
    },
  ],
};
const { nodes } = flatten(tree);

function resolve(...files: ContentFile[]) {
  return resolveNodeContent(nodes, files);
}

function file(path: string, frontmatter: string, body = ""): ContentFile {
  return { path, raw: `---\n${frontmatter}\n---\n${body}` };
}

describe("resolveNodeContent - the five build failures (V-13)", () => {
  it("rejects a file that matches no node, naming it", () => {
    expect(() => resolve(file("n-node/gone.md", "status: Done"))).toThrow(
      /content\/n-node\/gone\.md: matches no node/,
    );
  });

  it("rejects two files for one node, naming it", () => {
    expect(() =>
      resolve(
        file("n-node/evals.md", "status: Done"),
        file("n-node/evals/index.md", "status: Done"),
      ),
    ).toThrow(
      /content\/n-node\/evals\/index\.md: .*already has content\/n-node\/evals\.md/,
    );
  });

  it("rejects an unknown frontmatter key, naming the file", () => {
    expect(() => resolve(file("n-node/rag/index.md", "staus: Done"))).toThrow(
      /content\/n-node\/rag\/index\.md: .*(unrecognized|Unrecognized).*staus/,
    );
  });

  it("rejects a status outside the closed set, naming the file", () => {
    expect(() =>
      resolve(file("n-node/rag/index.md", "status: Blocked")),
    ).toThrow(/content\/n-node\/rag\/index\.md: status:/);
  });

  it("rejects the hub's own file as the hub, not as an unknown node", () => {
    expect(() => resolve(file("index.md", "status: Done"))).toThrow(
      /content\/index\.md: the hub has no page/,
    );
    // Checked first, so it reads as the hub even when other files would also fail.
    expect(() =>
      resolve(file("n-node/gone.md", "status: Done"), file("index.md", "")),
    ).toThrow(/the hub has no page/);
  });
});

describe("resolveNodeContent - other validation", () => {
  it("holds assignee to the seed's own trimmed-string rule", () => {
    expect(() =>
      resolve(file("n-node/rag/index.md", 'assignee: " Nemanja "')),
    ).toThrow(/content\/n-node\/rag\/index\.md: assignee: .*whitespace/);
  });

  // R-7: YAML coerces `Yes` to a boolean and `2024` to a number.
  it("rejects a value YAML coerced to a non-string", () => {
    expect(() =>
      resolve(file("n-node/rag/index.md", "assignee: 2024")),
    ).toThrow(/content\/n-node\/rag\/index\.md: assignee/);
  });

  it("refuses JavaScript frontmatter rather than evaluating it", () => {
    const js: ContentFile = {
      path: "n-node/rag/index.md",
      raw: '---js\n{ status: "Done" }\n---\n',
    };
    expect(() => resolve(js)).toThrow(
      /content\/n-node\/rag\/index\.md: .*only YAML/,
    );
  });
});

describe("resolveNodeContent - defaults (V-12, V-7)", () => {
  it("gives every node an entry, file or no file", () => {
    const content = resolve();

    expect(content.size).toBe(nodes.length);
    expect(content.get("ai/n-node/rag")).toEqual({
      title: "RAG",
      tags: [],
      assignee: "Unassigned",
      status: "Todo",
      body: "",
      hasFile: false,
    });
    // No exception for the hub or a ring topic (node-hover-card spec §3 Q3, C-5).
    expect(content.get("ai")).toMatchObject({
      assignee: "Unassigned",
      status: "Todo",
    });
  });

  it("keeps a status authored alone, and defaults the assignee", () => {
    const content = resolve(file("n-node/evals.md", "status: In Progress"));
    expect(content.get("ai/n-node/evals")).toMatchObject({
      assignee: "Unassigned",
      status: "In Progress",
      hasFile: true,
    });
  });

  it("keeps an assignee authored alone, and defaults the status", () => {
    const content = resolve(
      file("n-node/rag/index.md", "assignee: Nemanja Vasic"),
    );
    expect(content.get("ai/n-node/rag")).toMatchObject({
      assignee: "Nemanja Vasic",
      status: "Todo",
    });
  });

  it("reads a frontmatter-only file the same as no file wherever the body shows", () => {
    const withFile = resolve(file("n-node/evals.md", "status: Todo"));
    const without = resolve();

    expect(withFile.get("ai/n-node/evals")!.body).toBe("");
    expect(withFile.get("ai/n-node/evals")).toEqual({
      ...without.get("ai/n-node/evals"),
      hasFile: true,
    });
  });

  it("strips the frontmatter from the body and trims it", () => {
    const content = resolve(
      file("n-node/rag/index.md", "status: Done", "\n\nSome **prose**.\n\n"),
    );
    expect(content.get("ai/n-node/rag")!.body).toBe("Some **prose**.");
  });

  it("matches a leaf by either form", () => {
    expect(
      resolve(file("n-node/evals.md", "status: Done")).get("ai/n-node/evals")!
        .status,
    ).toBe("Done");
    expect(
      resolve(file("n-node/evals/index.md", "status: Done")).get(
        "ai/n-node/evals",
      )!.status,
    ).toBe("Done");
  });

  it("lower-cases and de-duplicates tags silently", () => {
    const content = resolve(
      file("n-node/rag/index.md", "tags: [Retrieval, LLM, retrieval, llm]"),
    );
    expect(content.get("ai/n-node/rag")!.tags).toEqual(["retrieval", "llm"]);
  });

  it("changes only the title when one is given", () => {
    const content = resolve(
      file("n-node/rag/index.md", "title: Retrieval-Augmented Generation"),
    );
    expect(content.get("ai/n-node/rag")).toEqual({
      title: "Retrieval-Augmented Generation",
      tags: [],
      assignee: "Unassigned",
      status: "Todo",
      body: "",
      hasFile: true,
    });
  });
});

describe("loadNodeContent", () => {
  it("reads files from disk and defaults every node without one", () => {
    const content = loadNodeContent(fixtureSeed, FIXTURE_CONTENT_DIR);

    expect(content.get("pd-ai/n-node/rag")).toMatchObject({
      assignee: "Nemanja Vasic",
      status: "Done",
      hasFile: true,
    });
    expect(content.get("pd-ai/n-node/rag")!.body).toMatch(
      /^Retrieval-Augmented Generation \(RAG\) is a pattern/,
    );
    expect(content.get("pd-ai/n-node/evals")).toMatchObject({
      assignee: "Unassigned",
      status: "In Progress",
      body: "",
    });

    const authored = new Set(["pd-ai/n-node/rag", "pd-ai/n-node/evals"]);
    for (const node of flatten(fixtureSeed).nodes) {
      if (authored.has(node.id)) continue;
      expect(content.get(node.id)).toMatchObject({
        assignee: "Unassigned",
        status: "Todo",
        hasFile: false,
      });
    }
  });

  it("treats a missing directory as no files", () => {
    const content = loadNodeContent(fixtureSeed, "/nonexistent/content");
    expect(content.get("pd-ai/n-node/rag")!.hasFile).toBe(false);
  });
});

/**
 * The live `content/` and `seed.ts`, checked only for what must hold whatever
 * anyone has written: it resolves (the same check `next build` runs), every node
 * has an entry, and every file on disk was matched to one. No names, no values -
 * so writing a page or adding a topic never means editing this test.
 */
describe("the live content/ tree", () => {
  it("resolves against the live seed, one file per matched node", () => {
    const content = loadNodeContent(seed);
    const { nodes } = flatten(seed);

    expect(content.size).toBe(nodes.length);
    const onDisk = readdirSync(join(process.cwd(), "content"), {
      recursive: true,
    }).filter((path) => String(path).endsWith(".md"));
    expect([...content.values()].filter((entry) => entry.hasFile)).toHaveLength(
      onDisk.length,
    );
  });
});
