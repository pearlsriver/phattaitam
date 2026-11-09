import type { Metadata } from "next";
import CategoryPage from "@/components/posts/CategoryPage";
import { CATEGORIES } from "@/types/post";

export const metadata: Metadata = {
  title: "Văn",
  description: CATEGORIES["van"].description,
  alternates: { canonical: "/van" },
};

export default function Page() {
  return <CategoryPage category="van" />;
}
