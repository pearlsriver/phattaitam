/* eslint-disable @next/next/no-img-element */
export default function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
  const letter = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const style = { width: size, height: size, fontSize: size * 0.42 };
  return url ? (
    <img src={url} alt={name ?? ""} style={style} className="shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
  ) : (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-full bg-accent font-serif font-semibold text-paper">
      {letter}
    </span>
  );
}
