import { getSiteOrigin } from "./site-origin";
import { siteConfig } from "./site-config";

export async function StructuredData() {
  const origin = await getSiteOrigin();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: `${origin}/`,
        name: siteConfig.name,
        alternateName: siteConfig.alternateName,
        description: siteConfig.description,
        inLanguage: ["zh-CN", "zh-Hant"],
        publisher: { "@id": `${origin}/#business` },
      },
      {
        "@type": "RealEstateAgent",
        "@id": `${origin}/#business`,
        name: siteConfig.alternateName,
        alternateName: siteConfig.name,
        url: `${origin}/`,
        image: `${origin}/amy-zhou.jpg`,
        logo: `${origin}/favicon.png`,
        telephone: "+1-346-582-7694",
        email: "ningimeng12@gmail.com",
        description: siteConfig.description,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Houston",
          addressRegion: "TX",
          addressCountry: "US",
        },
        areaServed: [
          "Greater Houston",
          "Katy",
          "Fulshear",
          "Sugar Land",
          "Bellaire",
          "Cypress",
          "The Woodlands",
          "Pearland",
        ],
        employee: {
          "@type": "Person",
          "@id": `${origin}/#amy-zhou`,
          name: "Amy Zhou",
          jobTitle: "Texas Real Estate Sales Agent",
          image: `${origin}/amy-zhou.jpg`,
          telephone: "+1-346-582-7694",
          email: "ningimeng12@gmail.com",
          knowsLanguage: ["zh-CN", "zh-Hant", "en"],
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            name: "Texas Real Estate Sales Agent License",
            credentialCategory: "license",
            identifier: "839083",
          },
        },
        knowsLanguage: ["zh-CN", "zh-Hant", "en"],
        serviceType: ["Residential real estate", "Real estate investment", "School district home search"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
    />
  );
}
