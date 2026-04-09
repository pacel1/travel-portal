import type { MetadataRoute } from "next";

import { pagePayloads } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://travel-portal.vercel.app";

  return [
    {
      url: baseUrl,
      priority: 1,
    },
    ...pagePayloads.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      priority: 0.8,
    })),
  ];
}
