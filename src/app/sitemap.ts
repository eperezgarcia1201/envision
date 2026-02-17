import type { MetadataRoute } from "next";

const baseUrl = "https://envisionmaintenence.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/services",
    "/gallery",
    "/contact",
    "/platform",
    "/portal",
    "/admin",
    "/api-docs",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
