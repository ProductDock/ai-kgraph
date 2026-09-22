import type { GraphSeed } from "@/lib/graph/types";

/**
 * THE CONTENT. Transcribed exactly from the intent's Constraints tree - 36 nodes,
 * five levels. This is the only file a content change touches; adding a topic is a
 * file edit and a PR (spec D-3, FR-2).
 *
 * Two labels read as placeholders and four read as notes-to-self. They are recorded
 * as they were written rather than invented, and ship verbatim until the originator
 * names them (spec D-10, D-11, C-8). `satisfies` keeps a bad edit a red squiggle
 * before it is a failed build; `flatten` re-validates the invariants types cannot
 * express.
 *
 * `assignee` and `status` are optional and authored only where someone has a real
 * answer (node-hover-card spec §7). Everything without them reads "Unassigned" and
 * "Todo" - the default, applied uniformly in `flatten()`, not a gap to fill in.
 * Note that both ship to every visitor at build time, not per hover: a name written
 * here is published to anyone who can load `/graph` (node-hover-card C-1, accepted).
 */
export const seed = {
  // The hub reads its own name inside the circle (spec FR-1). Still provisional:
  // whether "PD AI" is the real name or a placeholder is the originator's call
  // (spec §3, Q1).
  name: "PD AI",
  children: [
    {
      name: "AI Agents",
      children: [
        {
          // [verbatim - reads as a note, needs a title] (D-11)
          name: "Find agent example max 5-10",
          children: [
            { name: "Claude Agent SDK" },
            { name: "Google ADK" },
            { name: "Langchain" },
            { name: "Langgraph" },
            { name: "Strands" },
            { name: "OpenAI API compatible" },
            // [verbatim - reads as a note] (D-11)
            { name: "Bring your own but check with us" },
          ],
        },
        {
          name: "How coding agents are built",
          children: [
            { name: "pi" },
            { name: "opencode" },
            { name: "tau" },
            // [verbatim - reads as a note] (D-11)
            { name: "what else is hyped now or active" },
          ],
        },
        {
          name: "Workflows",
          children: [
            { name: "n8n" },
            // [verbatim - reads as a note] (D-11)
            { name: "something else" },
          ],
        },
      ],
    },
    {
      // [placeholder name, not yet decided] (D-10)
      name: "n Node",
      children: [
        {
          // The intent's own worked example, verbatim.
          name: "RAG",
          assignee: "Nemanja Vasic",
          status: "Done",
          children: [
            {
              name: "Vector db",
              children: [
                { name: "pgvector" },
                { name: "Qdrant" },
                { name: "S3 vector" },
              ],
            },
          ],
        },
        {
          // Status without an assignee: the third status word, and the case where
          // one field is authored and the other is not, are both on screen.
          name: "Evals",
          status: "In Progress",
          children: [{ name: "Ragas" }, { name: "DeepEval" }],
        },
        {
          name: "Techniques",
          children: [{ name: "Spec driven development" }, { name: "AI TDD" }],
        },
      ],
    },
    {
      name: "Protocols",
      children: [
        {
          name: "MCP",
          children: [
            { name: "Web browser MCP" },
            { name: "Oauth with Keycloak" },
          ],
        },
        { name: "A2A" },
      ],
    },
    // [placeholder name, not yet decided] (D-10)
    { name: "n Node for non technical person (product and designers)" },
  ],
} satisfies GraphSeed;
