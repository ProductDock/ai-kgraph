import type { GraphSceneNode } from "@/lib/graph/types";

/**
 * The inline key in the route header: one entry per ring topic, its name beside the
 * colour it was actually assigned (branch-colour spec FR-11, §8.5).
 *
 * It takes the topics as a prop rather than reading a constant, because colour now
 * depends on the tree's own shape - which ring topics exist, and which hue each one
 * ended up with - so there is nothing static left to import.
 *
 * This is not decoration. Three of the light-mode hues sit below 3:1 against the page
 * and the fourth ring pair sits in the validator's 6-8 CVD band; both are legal only
 * with the "visible labels" relief the validator requires, and this key is half of
 * what supplies it (spec §8.1, C-4). Dropping it re-opens that check.
 *
 * Still the *inline* key, not the sidebar legend the original graph spec put out of
 * scope.
 */
export function BranchKey({ topics }: { topics: GraphSceneNode[] }) {
  return (
    <ul
      aria-label="Which colour is which topic"
      className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
    >
      {topics.map((topic) => (
        <li key={topic.id} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: `var(${topic.colourToken})` }}
          />
          {topic.name}
        </li>
      ))}
    </ul>
  );
}
