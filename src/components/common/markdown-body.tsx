import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import ReactMarkdown, {
  type Components,
  type ExtraProps,
} from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { PROSE_LINK } from "@/components/common/link-styles";
import { cn } from "@/lib/utils";

/**
 * A node's markdown body (node-content-pages spec §9.4). A Server Component: it ships
 * no JavaScript, and it renders to React elements rather than an HTML string.
 *
 * Raw HTML in the source stays inert text because `rehype-raw` is deliberately
 * **not** in the plugin list - that is the whole of FR-10's "never rendered as
 * markup", and adding the plugin undoes it. `urlTransform` is left at react-markdown's
 * default, which is what drops a `javascript:` href. Neither is a setting to "fix".
 *
 * There is no typography plugin in this app, so each element carries its own
 * classes here. Markdown headings are shifted down one level (`#` renders `h2`) so
 * the page's own title stays the only `h1`.
 */

/**
 * react-markdown hands every component the hast `node` it came from. Spread onto a
 * DOM element it would render as `node="[object Object]"`, so it is dropped here, in
 * one place.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dom<P extends ExtraProps>({ node, ...props }: P) {
  return props;
}

function heading(Tag: "h2" | "h3" | "h4" | "h5" | "h6", className: string) {
  function Heading(props: ComponentPropsWithoutRef<"h1"> & ExtraProps) {
    const { className: own, ...rest } = dom(props);
    return <Tag className={cn(className, own)} {...rest} />;
  }
  return Heading;
}

const components: Components = {
  h1: heading("h2", "mt-8 text-2xl leading-tight font-semibold"),
  h2: heading("h3", "mt-8 text-xl leading-snug font-semibold"),
  h3: heading("h4", "mt-6 text-lg leading-snug font-semibold"),
  h4: heading("h5", "mt-6 text-base font-semibold"),
  h5: heading("h6", "mt-6 text-base font-semibold"),
  h6: heading("h6", "mt-6 text-sm font-semibold"),
  p: (props) => <p className="mt-4" {...dom(props)} />,
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "mt-4 list-disc space-y-1 pl-6",
        // A GFM task list carries its own checkboxes, so no bullet as well.
        className?.includes("contains-task-list") && "list-none pl-0",
        className,
      )}
      {...dom(props)}
    />
  ),
  ol: (props) => (
    <ol className="mt-4 list-decimal space-y-1 pl-6" {...dom(props)} />
  ),
  blockquote: (props) => (
    <blockquote
      className="text-muted-foreground mt-4 border-l pl-4"
      {...dom(props)}
    />
  ),
  hr: (props) => <hr className="my-8" {...dom(props)} />,
  a: ({ href = "", className, ...props }) =>
    // Site-relative links (another topic's page) go through the client router;
    // anything else is a plain anchor. Neither is checked against the tree (C-4).
    href.startsWith("/") ? (
      <Link href={href} className={cn(PROSE_LINK, className)} {...dom(props)} />
    ) : (
      <a href={href} className={cn(PROSE_LINK, className)} {...dom(props)} />
    ),
  // A plain <img>: images are committed files under public/content/<address>/ and
  // there is no optimisation pipeline for them (spec §2.3).
  img: ({ alt = "", ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className="mt-4 h-auto max-w-full" {...dom(props)} />
  ),
  pre: (props) => (
    <pre
      // `[&>code]` undoes the inline-code chip for a fenced block's <code>, which
      // has no class to tell it apart when the fence names no language.
      className="mt-4 overflow-x-auto rounded-xl border bg-[var(--surface-1)] p-4 text-sm leading-relaxed [&>code]:bg-transparent [&>code]:px-0"
      {...dom(props)}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "bg-[var(--surface-1)] px-1 font-mono text-[0.9em]",
        className,
      )}
      {...dom(props)}
    />
  ),
  table: (props) => (
    <div className="mt-4 overflow-x-auto">
      <table
        className="w-full border-collapse border text-sm"
        {...dom(props)}
      />
    </div>
  ),
  th: (props) => (
    <th className="border px-3 py-2 text-left font-semibold" {...dom(props)} />
  ),
  td: (props) => <td className="border px-3 py-2" {...dom(props)} />,
};

export function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
