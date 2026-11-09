import { TERMS, TERMS_MOTTO, TERMS_SITE, TERMS_TITLE } from "@/lib/terms";

/** Toàn văn Điều lệ (dùng ở trang /dieu-le và cửa sổ đồng ý) */
export default function TermsContent({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "text-sm leading-relaxed" : "leading-relaxed"}>
      <header className="mb-6 text-center">
        <h2 className={`font-serif font-semibold text-ink ${compact ? "text-xl" : "text-3xl"}`}>{TERMS_TITLE}</h2>
        <p className={`mt-1 font-serif font-semibold text-accent ${compact ? "text-lg" : "text-2xl"}`}>{TERMS_SITE}</p>
        <p className="mt-2 italic text-muted">{TERMS_MOTTO}</p>
      </header>
      <div className="space-y-3 text-ink-soft">
        {TERMS.map((b, i) => {
          if (b.type === "h") return <h3 key={i} className="!mt-7 font-serif text-lg font-semibold text-ink">{b.text}</h3>;
          if (b.type === "ul")
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-accent">
                {b.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            );
          if (b.type === "quote")
            return <blockquote key={i} className="border-l-4 border-accent bg-accent-soft/40 px-4 py-3 font-serif italic text-ink">{b.text}</blockquote>;
          return <p key={i}>{b.text}</p>;
        })}
      </div>
    </div>
  );
}
