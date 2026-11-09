"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";
import Avatar from "@/components/social/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/thu-vien", label: "Thư viện" },
  { href: "/nhac", label: "Nhạc" },
  { href: "/album", label: "Album" },
  { href: "/cong-dong", label: "Cộng đồng" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, profile, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const mobileLinks = [
    ...LINKS,
    ...(user
      ? [
          { href: "/dashboard", label: "Tài khoản" },
          { href: "/ho-so", label: "Hồ sơ" },
          { href: "/playlist", label: "Playlist của tôi" },
        ]
      : [{ href: "/login", label: "Đăng nhập" }]),
    ...(isAdmin ? [{ href: "/admin", label: "Quản trị" }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-serif text-xl font-bold text-paper">P</span>
          <span className="leading-tight">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-muted">Thư Viện Số</span>
            <span className="block font-serif text-lg font-semibold text-ink">Phật Tại Tâm</span>
          </span>
        </Link>

        <nav className="ml-4 hidden gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm transition ${
                isActive(l.href) ? "bg-soft font-medium text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {loading ? null : user ? (
            <div className="hidden items-center gap-1 sm:flex">
              {isAdmin && (
                <Link href="/admin" className="rounded-full px-3 py-2 text-sm text-accent hover:bg-soft">Quản trị</Link>
              )}
              <Link
                href="/dashboard"
                className="flex max-w-48 items-center gap-2 rounded-full border border-line py-1 pl-1 pr-4 text-sm text-ink hover:bg-soft"
              >
                <Avatar url={profile?.avatar_url} name={profile?.full_name} size={28} />
                <span className="truncate">{profile?.full_name || "Tài khoản"}</span>
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="hidden rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90 sm:block"
            >
              Đăng nhập với Google
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line px-4 py-3 lg:hidden">
          {mobileLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 ${isActive(l.href) ? "bg-soft font-medium text-ink" : "text-ink-soft"}`}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <div className="mt-2 px-1">
              <LogoutButton />
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
