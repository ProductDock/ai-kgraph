import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { nodeAddress } from "@/lib/graph/paths";
import { seed } from "@/lib/graph/seed";
import { flatten } from "@/lib/graph/tree";
import NodePage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";

// No vitest globals here, so testing-library cannot register its own cleanup.
afterEach(cleanup);

async function renderPage(...slug: string[]) {
  render(await NodePage({ params: Promise.resolve({ slug }) }));
}

describe("generateStaticParams", () => {
  // V-5, V-9
  it("lists every non-hub node's address, and never the hub", () => {
    const { nodes } = flatten(seed);
    const expected = nodes
      .filter((node) => node.parentId !== null)
      .map((node) => nodeAddress(node.id));

    const params = generateStaticParams().map(({ slug }) => slug.join("/"));

    expect(params).toEqual(expected);
    expect(params).toHaveLength(nodes.length - 1);
    expect(params).not.toContain("");
    expect(params).toContain("n-node/rag/vector-db/pgvector");
  });
});

// FR-9. Not `dynamicParams = false` (plan R-1): the lookup is what rejects an
// unknown address, so that `graph/not-found.tsx` is the page that renders.
describe("an address that matches no node", () => {
  it.each([[["nope"]], [["n-node", "rag", "nope"]]])(
    "%j calls notFound()",
    async (slug) => {
      expect(dynamicParams).toBe(true);
      await expect(
        NodePage({ params: Promise.resolve({ slug }) }),
      ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
    },
  );
});

describe("the RAG page", () => {
  it("shows the title, owner, status, body and Key Topics", async () => {
    await renderPage("n-node", "rag");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("RAG");
    expect(screen.getByText("Nemanja Vasic")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(
      screen.getByText(/Retrieval-Augmented Generation \(RAG\) is a pattern/),
    ).toBeInTheDocument();
    expect(screen.queryByText("No content yet.")).toBeNull();

    const topics = within(
      screen.getByRole("region", { name: "Key Topics" }),
    ).getAllByRole("link");
    expect(topics.map((link) => link.textContent)).toEqual(["Vector db"]);
    expect(topics[0]).toHaveAttribute("href", "/graph/n-node/rag/vector-db");
  });

  it("has a breadcrumb from the hub, and the node itself as the current crumb", async () => {
    await renderPage("n-node", "rag");

    const crumbs = within(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    );
    expect(crumbs.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["PD AI", "n Node"],
    );
    expect(crumbs.getByRole("link", { name: "PD AI" })).toHaveAttribute(
      "href",
      "/graph",
    );
    expect(crumbs.getByRole("link", { name: "n Node" })).toHaveAttribute(
      "href",
      "/graph/n-node",
    );
    expect(crumbs.getByText("RAG")).toHaveAttribute("aria-current", "page");
  });

  it("links back to the graph and to the graph focused on RAG", async () => {
    await renderPage("n-node", "rag");

    expect(
      screen.getByRole("link", { name: /Back to AI Learning Graph/ }),
    ).toHaveAttribute("href", "/graph");
    expect(screen.getByRole("link", { name: "View Graph" })).toHaveAttribute(
      "href",
      "/graph?focus=n-node/rag",
    );
  });

  it("titles the tab with the node's name", async () => {
    expect(
      await generateMetadata({
        params: Promise.resolve({ slug: ["n-node", "rag"] }),
      }),
    ).toEqual({ title: "RAG" });
  });
});

// V-6, V-7
describe("a page with nothing written", () => {
  it.each([
    ["Evals (a file with no body)", ["n-node", "evals"], "In Progress"],
    ["Techniques (no file)", ["n-node", "techniques"], "Todo"],
  ])(
    "%s reads No content yet and still lists Key Topics",
    async (_, slug, status) => {
      await renderPage(...slug);

      expect(screen.getByText("No content yet.")).toBeInTheDocument();
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
      expect(screen.getByText(status)).toBeInTheDocument();
      expect(
        within(screen.getByRole("region", { name: "Key Topics" })).getAllByRole(
          "link",
        ).length,
      ).toBeGreaterThan(0);
    },
  );
});

describe("a leaf", () => {
  it("has no Key Topics section at all", async () => {
    await renderPage("protocols", "a2a");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A2A");
    expect(screen.queryByRole("heading", { name: "Key Topics" })).toBeNull();
  });
});
