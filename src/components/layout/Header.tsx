"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/layout/ThemeToggle";
import Avatar from "@/components/social/Avatar";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
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

  // Đóng menu điện thoại khi chuyển trang
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) || (href === "/nhac" && pathname.startsWith("/album"));

  const accountLinks = user
    ? [
        { href: "/dashboard", label: "Tài khoản" },
        { href: "/ho-so", label: "Hồ sơ" },
        { href: "/playlist", label: "Playlist của tôi" },
        { href: "/viet-bai", label: "✍️ Viết bài / Tải sách" },
        ...(isAdmin ? [{ href: "/admin", label: "Quản trị" }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="safe-x mx-auto flex max-w-6xl items-center gap-2 py-2 sm:gap-4 sm:py-3">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="Phật Tại Tâm — Trang chủ">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-sm.png"
            alt="Logo Phật Tại Tâm"
            width={44}
            height={44}
            className="h-9 w-9 shrink-0 rounded-full shadow-[0_0_0_1px_var(--line)] transition duration-300 group-hover:rotate-6 group-hover:scale-105 sm:h-11 sm:w-11"
          />
          <span className="min-w-0 leading-tight">
            <span className="hidden text-[11px] uppercase tracking-[0.2em] text-muted sm:block">Thư Viện Số</span>
            <span className="block truncate font-serif text-base font-semibold text-ink sm:text-lg">Phật Tại Tâm</span>
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

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {loading ? null : user ? (
            <div className="hidden items-center gap-1 md:flex">
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
            <button type="button" onClick={() => signInWithGoogle()} className="btn btn-primary hidden md:inline-flex">
              Đăng nhập với Google
            </button>
          )}
          {/* Điện thoại: ảnh đại diện mở menu */}
          {user && (
            <button type="button" onClick={() => setOpen(!open)} className="md:hidden" aria-label="Tài khoản">
              <Avatar url={profile?.avatar_url} name={profile?.full_name} size={34} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            className="btn-icon border border-line md:hidden"
          >
            {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Thanh menu chính trên điện thoại: luôn hiện, chạm bằng ngón cái dễ dàng */}
      <nav className="safe-x flex gap-1 pb-2 md:hidden" aria-label="Menu chính">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition ${
              isActive(l.href) ? "bg-accent-soft text-accent" : "text-ink-soft active:bg-soft"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {open && (
        <div className="anim-in safe-x max-h-[70vh] overflow-y-auto border-t border-line bg-paper py-3 md:hidden">
          {user ? (
            <>
              <div className="mb-2 flex items-center gap-3 px-3 py-2">
                <Avatar url={profile?.avatar_url} name={profile?.full_name} size={40} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{profile?.full_name || "Tài khoản"}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
              </div>
              {accountLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`block rounded-xl px-3 py-3 ${isActive(l.href) ? "bg-accent-soft font-medium text-accent" : "text-ink-soft active:bg-soft"}`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-line px-1 pt-2"><LogoutButton /></div>
            </>
          ) : (
            <div className="space-y-2 px-1">
              <button type="button" onClick={() => signInWithGoogle()} className="btn btn-primary w-full !py-3">Đăng nhập với Google</button>
              <Link href="/login" className="btn btn-secondary w-full !py-3">Đăng nhập bằng email</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
