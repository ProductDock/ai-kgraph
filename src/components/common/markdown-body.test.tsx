import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MarkdownBody } from "@/components/common/markdown-body";

// No vitest globals here, so testing-library cannot register its own cleanup.
afterEach(cleanup);

const FIXTURE = `
# Heading

| Pattern | Retrieves |
| ------- | --------- |
| RAG     | Documents |

~~obsolete~~

- [x] done
- [ ] not yet

See https://example.com for more.

\`\`\`ts
const answer: number = 42;
\`\`\`

![Pipeline diagram](/content/n-node/rag/pipeline.png)

Read [Vector db](/graph/n-node/rag/vector-db) next.

<script>alert(1)</script>

[bad link](javascript:alert(1))
`;

// V-11
describe("MarkdownBody", () => {
  it("renders GitHub-flavoured markdown", () => {
    const { container } = render(<MarkdownBody>{FIXTURE}</MarkdownBody>);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Pattern" })).toBeVisible();
    expect(container.querySelector("del")).toHaveTextContent("obsolete");

    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).not.toBeChecked();

    expect(
      screen.getByRole("link", { name: "https://example.com" }),
    ).toHaveAttribute("href", "https://example.com");
  });

  it("highlights a fenced block with classes, not inline colour", () => {
    const { container } = render(<MarkdownBody>{FIXTURE}</MarkdownBody>);

    const keyword = container.querySelector("pre code .hljs-keyword");
    expect(keyword).toHaveTextContent("const");
    expect(container.querySelector("pre [style]")).toBeNull();
  });

  it("renders an image and an internal link", () => {
    render(<MarkdownBody>{FIXTURE}</MarkdownBody>);

    expect(
      screen.getByRole("img", { name: "Pipeline diagram" }),
    ).toHaveAttribute("src", "/content/n-node/rag/pipeline.png");
    expect(screen.getByRole("link", { name: "Vector db" })).toHaveAttribute(
      "href",
      "/graph/n-node/rag/vector-db",
    );
  });

  it("shows raw HTML as text and never renders it", () => {
    const { container } = render(<MarkdownBody>{FIXTURE}</MarkdownBody>);

    expect(container.querySelector("script")).toBeNull();
    expect(container).toHaveTextContent("<script>alert(1)</script>");
  });

  it("drops a javascript: href", () => {
    render(<MarkdownBody>{FIXTURE}</MarkdownBody>);

    const link = screen.getByText("bad link").closest("a");
    expect(link?.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
  });

  it("shifts headings down a level so the page keeps the only h1", () => {
    render(<MarkdownBody>{FIXTURE}</MarkdownBody>);

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "Heading" }),
    ).toBeInTheDocument();
  });
});
