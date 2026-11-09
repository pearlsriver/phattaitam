"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/layout/ThemeToggle";
import Avatar from "@/components/social/Avatar";
import { MenuIcon } from "@/components/ui/Icons";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth";

const LINKS = [
  { href: "/thu-vien", label: "Thư Viện" },
  { href: "/sach", label: "Sách" },
  { href: "/nhac", label: "Nhạc" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, profile, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`) || (href === "/nhac" && pathname.startsWith("/album")) ;
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
    <header className="sticky top-0 z-30 border-b border-line bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-3" aria-label="Phật Tại Tâm — Trang chủ">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-sm.png"
            alt="Logo Phật Tại Tâm"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full shadow-[0_0_0_1px_var(--line)] transition duration-300 group-hover:rotate-6 group-hover:scale-105"
          />
          <span className="leading-tight">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-muted">Thư Viện Số</span>
            <span className="block font-serif text-lg font-semibold text-ink">Phật Tại Tâm</span>
          </span>
        </Link>

        <nav className="ml-4 hidden gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive(l.href) ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-soft hover:text-ink"
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
              {isAdmin && <Link href="/admin" className="btn btn-ghost !py-2 text-accent">Quản trị</Link>}
              <Link
                href="/dashboard"
                className="flex max-w-48 items-center gap-2 rounded-full border border-line py-1 pl-1 pr-4 text-sm text-ink transition hover:border-accent hover:bg-soft"
              >
                <Avatar url={profile?.avatar_url} name={profile?.full_name} size={28} />
                <span className="truncate">{profile?.full_name || "Tài khoản"}</span>
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <button type="button" onClick={() => signInWithGoogle()} className="btn btn-primary hidden sm:inline-flex">
              Đăng nhập với Google
            </button>
          )}
          <button type="button" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="btn-icon border border-line md:hidden">
            <MenuIcon size={20} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="anim-in border-t border-line px-4 py-3 md:hidden">
          {mobileLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-3 py-2.5 ${isActive(l.href) ? "bg-accent-soft font-medium text-accent" : "text-ink-soft hover:bg-soft"}`}
            >
              {l.label}
            </Link>
          ))}
          {user && <div className="mt-2 px-1"><LogoutButton /></div>}
        </nav>
      )}
    </header>
  );
}
