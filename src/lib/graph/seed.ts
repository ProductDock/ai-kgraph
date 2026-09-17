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
 */
export const seed = {
  name: "AI",
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
          name: "RAG",
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
          name: "Evals",
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
