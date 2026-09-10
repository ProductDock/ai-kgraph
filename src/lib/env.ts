import { z } from "zod";

const server = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Add server-only vars here. NEVER prefix these NEXT_PUBLIC_, and NEVER
  // put ANTHROPIC_API_KEY (or any secret) here without confirming it stays
  // server-only end to end - this Proxy only guards reads, not leaks via
  // props passed into a client component.
});

const client = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

// Fail fast and loudly at boot, listing every problem at once.
function parse<T extends z.ZodTypeAny>(
  schema: T,
  source: unknown,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid ${label} environment:\n` +
        result.error.issues
          .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
          .join("\n"),
    );
  }
  return result.data;
}

// NODE_ENV is not secret and Next inlines it as a build-time constant, so
// reading it directly (unlike serverEnv) is safe in client code too. It is
// exported here rather than read ad-hoc so env.ts stays the only module
// touching process.env (V-7).
export const isProduction = process.env.NODE_ENV === "production";

// Client vars must be referenced statically - Next inlines them at build
// time, so process.env[key] with a computed key silently yields undefined.
export const clientEnv = parse(
  client,
  { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL },
  "client",
);

export const serverEnv = new Proxy({} as z.infer<typeof server>, {
  get(_target, prop: string) {
    if (typeof window !== "undefined") {
      throw new Error(
        `serverEnv.${prop} was read in the browser. Use clientEnv.`,
      );
    }
    return parse(server, process.env, "server")[
      prop as keyof z.infer<typeof server>
    ];
  },
});
