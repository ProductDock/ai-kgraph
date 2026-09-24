"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { GraphStats } from "@/lib/graph/types";
import { useGraphStatsStore } from "@/stores/graph-stats-store";

export interface StatsShares {
  donePct: number;
  inProgressPct: number;
  doneFrac: number;
  inProgressFrac: number;
}

/**
 * The shares the panel shows. Each percentage is rounded on its own, so the two can
 * add up to 101; the bar uses the unrounded fractions. An empty graph is all zeros
 * rather than `NaN`.
 */
export function statsShares(stats: GraphStats): StatsShares {
  const { totalTopics, done, inProgress } = stats;
  if (totalTopics === 0) {
    return { donePct: 0, inProgressPct: 0, doneFrac: 0, inProgressFrac: 0 };
  }
  const doneFrac = done / totalTopics;
  const inProgressFrac = inProgress / totalTopics;
  return {
    donePct: Math.round(doneFrac * 100),
    inProgressPct: Math.round(inProgressFrac * 100),
    doneFrac,
    inProgressFrac,
  };
}

/**
 * How far along the graph is, in the top-right corner of the scene
 * (`intent/graph-progress-stats/`). Build-time numbers - as fresh as the last
 * deploy (spec C-2) - so nothing here fetches or refreshes.
 *
 * The positioned element is the corner *stack*, not the card, so a later widget is
 * a sibling child rather than a second absolutely-placed box (spec C-1). Unlike the
 * hover card it takes pointer events: it is ordinary chrome, and a drag started on
 * it does not orbit (§9.2). After the hover card in the DOM, so it paints above it.
 *
 * `aria-hidden` and the toggle `tabIndex={-1}`, the posture the rest of the scene
 * has (`intent/graph-accessibility/`, §9.5): a tab stop inside an `aria-hidden`
 * subtree is one a screen reader never announces.
 */
export function GraphStatsPanel({ stats }: { stats: GraphStats }) {
  const collapsed = useGraphStatsStore((state) => state.collapsed);
  const setCollapsed = useGraphStatsStore((state) => state.setCollapsed);
  const shares = statsShares(stats);
  const Chevron = collapsed ? ChevronDown : ChevronUp;

  return (
    <div
      aria-hidden="true"
      className="absolute top-4 right-4 flex flex-col items-end gap-2"
    >
      <Card size="sm" className="w-56">
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading text-sm leading-snug font-medium">
              Statistics
            </p>
            <button
              type="button"
              tabIndex={-1}
              data-testid="graph-stats-toggle"
              className="text-muted-foreground hover:text-foreground -m-1 rounded-sm p-1"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Chevron className="size-4" />
            </button>
          </div>
          {!collapsed && (
            <>
              <Row label="Topics" value={`${stats.totalTopics}`} />
              <Row
                label="Done"
                value={`${stats.done}/${stats.totalTopics} (${shares.donePct}%)`}
              />
              <Row
                label="In progress"
                value={`${stats.inProgress}/${stats.totalTopics} (${shares.inProgressPct}%)`}
              />
              <div
                data-testid="graph-stats-bar"
                className="bg-border mt-1 flex h-1.5 w-full overflow-hidden rounded-full"
              >
                <div
                  data-testid="graph-stats-done"
                  className="bg-primary"
                  style={{ width: `${shares.doneFrac * 100}%` }}
                />
                <div
                  data-testid="graph-stats-in-progress"
                  className="bg-primary/50"
                  style={{ width: `${shares.inProgressFrac * 100}%` }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** The hover card's `Row`, copied: one route uses it, so it is not shared yet. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="min-w-0 truncate tabular-nums">{value}</span>
    </p>
  );
}
