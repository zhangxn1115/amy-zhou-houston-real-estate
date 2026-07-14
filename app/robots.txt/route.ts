import { resolveSiteOrigin } from "../site-config";

export function GET(request: Request) {
  const origin = resolveSiteOrigin(new URL(request.url).origin);
  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
