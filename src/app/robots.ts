import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/ho-so", "/viet-bai", "/tai-nhac", "/sua-bai/", "/sua-nhac/", "/album/moi", "/album/sua/", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
