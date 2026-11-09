import type { Metadata } from "next";
import TermsContent from "@/components/legal/TermsContent";

export const metadata: Metadata = {
  title: "Điều lệ tham gia và chia sẻ nội dung",
  description: "Điều lệ tham gia và chia sẻ nội dung của Phật Tại Tâm — phụng sự Phật pháp, lan tỏa yêu thương, chia sẻ vô cầu.",
  alternates: { canonical: "/dieu-le" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-surface p-6 md:p-10">
      <TermsContent />
    </div>
  );
}
