import type { Metadata } from "next";
import CategoryPage from "@/components/posts/CategoryPage";
import { CATEGORIES } from "@/types/post";

export const metadata: Metadata = {
  title: "Kinh Phật",
  description: CATEGORIES["kinh-phat"].description,
  alternates: { canonical: "/kinh-phat" },
};

export default function Page() {
  return <CategoryPage category="kinh-phat" />;
}
