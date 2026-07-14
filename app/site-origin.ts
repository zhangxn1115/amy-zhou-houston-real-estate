import { headers } from "next/headers";
import { resolveSiteOrigin } from "./site-config";

export async function getSiteOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host") || "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || (host.startsWith("localhost") ? "http" : "https");

  return resolveSiteOrigin(`${protocol}://${host}`);
}
