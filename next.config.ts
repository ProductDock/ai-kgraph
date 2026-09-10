import type { NextConfig } from "next";

const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
  "default-src 'self'",
  // Next injects inline scripts for hydration/streaming, and the theme-flash
  // script (spec §7.3) is inline by design. A nonce needs middleware, which
  // forces dynamic rendering on every route - not worth it with no report
  // collector yet (spec §8.5, plan step 10). Report-Only until a deployment
  // target exists.
  "script-src 'self' 'unsafe-inline'",
  // Next and Tailwind both emit inline styles - a materially weaker
  // guarantee than the script directive (spec §8.5).
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Only meaningful once a TLS host exists - see plan §Risks, C-6.
          // { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          {
            key: "Content-Security-Policy-Report-Only",
            value: CONTENT_SECURITY_POLICY_REPORT_ONLY,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
