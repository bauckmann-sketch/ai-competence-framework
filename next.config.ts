import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents clickjacking — disallows embedding the site in iframes
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevents MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy XSS protection for older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Controls how much referrer info is sent with requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disables unnecessary browser features / APIs
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content Security Policy — allows Next.js, Recharts, inline scripts/styles and external APIs
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js dev & Recharts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://quickchart.io https://api.qrserver.com https://www.inovatix.cz",
      "connect-src 'self' https://api.resend.com https://api.airtable.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
