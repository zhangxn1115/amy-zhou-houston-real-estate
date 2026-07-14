export const siteConfig = {
  name: "Amy Zhou 休斯顿房产经纪",
  alternateName: "Amy Zhou Houston Real Estate",
  title: "休斯顿房产经纪 Amy Zhou｜华人买房、学区房与投资置业",
  description:
    "休斯顿华人房产经纪 Amy Zhou，提供中文自住买房、投资房产、优质学区与社区选择服务，覆盖 Katy、Sugar Land、Cypress、The Woodlands、Pearland 等大休斯顿地区。",
  updatedAt: "2026-07-13",
};

export function resolveSiteOrigin(fallbackOrigin: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Ignore an invalid optional override and use the request origin.
    }
  }

  return fallbackOrigin;
}
