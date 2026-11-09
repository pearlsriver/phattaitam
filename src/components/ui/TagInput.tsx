"use client";

import { useState } from "react";
import { CloseIcon } from "@/components/ui/Icons";
import { MAX_TAGS, SUGGESTED_TAGS, normalizeTag, parseTags, uniqueTags } from "@/utils/tags";

/** Ô nhập hashtag: gõ rồi Enter / dấu phẩy / dấu cách để thêm, bấm × để bỏ */
export default function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState("");

  function commit(raw: string) {
    const add = parseTags(raw.replace(/\s+/g, ","));
    if (add.length) onChange(uniqueTags([...value, ...add]));
    setText("");
  }

  const suggestions = SUGGESTED_TAGS.filter((t) => !value.includes(t));

  return (
    <div>
      <div className="field flex flex-wrap items-center gap-2 !py-2">
        {value.map((t) => (
          <span key={t} className="chip !py-1">
            #{t}
            <button type="button" aria-label={`Bỏ #${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="rounded-full hover:text-red-400">
              <CloseIcon size={12} />
            </button>
          </span>
        ))}
        {value.length < MAX_TAGS && (
          <input
            value={text}
            onChange={(e) => {
              const v = e.target.value;
              if (/[,;\s]$/.test(v)) commit(v);
              else setText(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commit(text); }
              else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
            }}
            onBlur={() => text.trim() && commit(text)}
            placeholder={value.length ? "Thêm hashtag…" : "Gõ hashtag, ví dụ: thiền, thơ, kinh-phật"}
            className="min-w-40 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            aria-label="Thêm hashtag"
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Gợi ý:</span>
        {suggestions.map((t) => (
          <button key={t} type="button" className="chip" onClick={() => onChange(uniqueTags([...value, normalizeTag(t)]))}>
            #{t}
          </button>
        ))}
        <span className="ml-auto">{value.length}/{MAX_TAGS}</span>
      </div>
    </div>
  );
}
