import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://buildmygroundwork.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/demo`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/demo/body`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/demo/mind`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/demo/heart`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/demo/lead`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];
}
