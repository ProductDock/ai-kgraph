import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type UnsupportedReason = "viewport" | "webgl";

// Copy verbatim from spec §7.9 - plain, no jargon, matching the app's voice.
// There is no 2D or text fallback by design: a second view is a second thing to
// keep in sync (intent Constraints, spec C-11).
const COPY: Record<UnsupportedReason, { title: string; body: string }> = {
  viewport: {
    title: "This view needs a bigger screen",
    body: "The graph is built for a desktop or a tablet — open it there and you'll be able to move around it.",
  },
  webgl: {
    title: "This browser can't draw the graph",
    body: "It needs WebGL, which this browser or machine doesn't have available. A recent Chrome, Firefox, Safari or Edge on a desktop or tablet will work.",
  },
};

export function UnsupportedNotice({ reason }: { reason: UnsupportedReason }) {
  const { title, body } = COPY[reason];

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{body}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
