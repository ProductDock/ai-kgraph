import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { nodeAddress } from "@/lib/graph/paths";
import { seed } from "@/lib/graph/seed";
import { flatten } from "@/lib/graph/tree";
import NodePage, { generateStaticParams } from "./page";

// No vitest globals here, so testing-library cannot register its own cleanup.
afterEach(cleanup);

/**
 * The live `seed.ts` and `content/`, checked only for what must hold whatever anyone
 * has written: every non-hub node has a page, and every one of them renders. No
 * names or values, so adding a topic or writing a page never means editing this.
 * The exact rendering is covered against a fixture in `page.test.tsx`.
 */
describe("every live topic page", () => {
  const { nodes } = flatten(seed);
  const pages = nodes.filter((node) => node.parentId !== null);

  // V-5, V-9
  it("is generated, and the hub has none", () => {
    expect(generateStaticParams().map(({ slug }) => slug.join("/"))).toEqual(
      pages.map((node) => nodeAddress(node.id)),
    );
  });

  it.each(pages.map((node) => [nodeAddress(node.id), node.name]))(
    "/graph/%s renders",
    async (address, name) => {
      render(
        await NodePage({
          params: Promise.resolve({ slug: address.split("/") }),
        }),
      );
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: "Breadcrumb" }),
      ).toHaveTextContent(name);
    },
  );
});
