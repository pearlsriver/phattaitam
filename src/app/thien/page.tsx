import type { Metadata } from "next";
import CategoryPage from "@/components/posts/CategoryPage";
import { CATEGORIES } from "@/types/post";

export const metadata: Metadata = {
  title: "Thiền",
  description: CATEGORIES["thien"].description,
  alternates: { canonical: "/thien" },
};

export default function Page() {
  return <CategoryPage category="thien" />;
}
