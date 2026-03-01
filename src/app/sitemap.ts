import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hackfest.dev";

  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/timeline`,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/brochure`,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified: new Date("2026-02-28"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
