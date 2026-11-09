"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Chế độ sáng" : "Chế độ tối"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft hover:bg-soft"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
