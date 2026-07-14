import type { Metadata } from "next";
import "./globals.css";
import { AutoLocale } from "./AutoLocale";
import { StructuredData } from "./StructuredData";
import { getSiteOrigin } from "./site-origin";
import { siteConfig } from "./site-config";

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getSiteOrigin();
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bingVerification = process.env.BING_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(origin),
    title: siteConfig.title,
    description: siteConfig.description,
    applicationName: siteConfig.name,
    authors: [{ name: "Amy Zhou", url: origin }],
    creator: "Amy Zhou",
    publisher: siteConfig.name,
    category: "Real Estate",
    alternates: { canonical: `${origin}/` },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      alternateLocale: ["zh_TW", "zh_HK", "en_US"],
      url: `${origin}/`,
      siteName: siteConfig.name,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [
        {
          url: `${origin}/og.png`,
          width: 1200,
          height: 630,
          alt: "Amy Zhou 休斯顿房产经纪—中文自住、投资与学区置业服务",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
      images: [`${origin}/og.png`],
    },
    verification: {
      ...(googleVerification ? { google: googleVerification } : {}),
      ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
    },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <StructuredData />
        {children}
        <AutoLocale />
      </body>
    </html>
  );
}
