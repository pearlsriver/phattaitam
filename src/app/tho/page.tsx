import type { Metadata } from "next";
import CategoryPage from "@/components/posts/CategoryPage";
import { CATEGORIES } from "@/types/post";

export const metadata: Metadata = {
  title: "Thơ",
  description: CATEGORIES["tho"].description,
  alternates: { canonical: "/tho" },
};

export default function Page() {
  return <CategoryPage category="tho" />;
}
