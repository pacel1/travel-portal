import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://triptimi.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*?_rsc=*", "/*?*_rsc=*"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
