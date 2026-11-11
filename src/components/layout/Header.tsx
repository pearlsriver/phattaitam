"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { EditableText } from "@/components/site/Editable";
import NavEditModal from "@/components/site/NavEditModal";
import SiteLogo from "@/components/site/SiteLogo";
import { useSite } from "@/components/site/SiteSettingsProvider";
import Avatar from "@/components/social/Avatar";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import RoleBadge from "@/components/ui/RoleBadge";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth";

export default function Header() {
  const pathname = usePathname();
  const { user, profile, role, isAdmin, loading } = useAuth();
  const { nav, canEdit, editMode, setEditMode } = useSite();
  const [open, setOpen] = useState(false);
  const [navEdit, setNavEdit] = useState(false);

  // Đóng menu điện thoại khi chuyển trang
  useEffect(() => setOpen(false), [pathname]);

  const links = nav.filter((n) => n.visible);
  const albumInMenu = links.some((l) => l.href === "/album");
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/nhac" && !albumInMenu && pathname.startsWith("/album"));

  const accountLinks = user
    ? [
        { href: "/dashboard", label: "Tài khoản" },
        { href: "/ho-so", label: "Hồ sơ" },
        { href: "/playlist", label: "Playlist của tôi" },
        { href: "/viet-bai", label: "✍️ Viết bài / Tải sách" },
        ...(isAdmin ? [{ href: "/admin", label: "Quản trị" }, { href: "/admin/thanh-vien", label: "👥 Thành viên" }] : []),
      ]
    : [];

  /** Nút bật/tắt chế độ sửa trang (chỉ Super Admin) */
  const editToggle = canEdit && (
    <button
      type="button"
      onClick={() => setEditMode(!editMode)}
      aria-pressed={editMode}
      title={editMode ? "Bấm để thoát chế độ sửa trang" : "Sửa chữ, menu, logo ngay trên trang"}
      className={`btn !min-h-0 !px-3 !py-2 !text-xs ${editMode ? "border border-purple-400/60 bg-purple-500/20 text-purple-300" : "btn-ghost"}`}
    >
      {editMode ? "✏️ Đang sửa trang" : "✏️ Chỉnh sửa trang"}
    </button>
  );

  /** Menu: khi đang sửa trang, bấm vào menu để sửa (thay vì chuyển trang) */
  const navLink = (l: { href: string; label: string }, cls: string) =>
    editMode ? (
      <button key={l.href} type="button" className={`${cls} editable`} onClick={() => setNavEdit(true)} title="Bấm để sửa menu">
        {l.label}
      </button>
    ) : (
      <Link key={l.href} href={l.href} className={cls}>{l.label}</Link>
    );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="safe-x mx-auto flex max-w-6xl items-center gap-2 py-2 sm:gap-4 sm:py-3">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="Trang chủ">
          <SiteLogo
            size="sm"
            className="h-9 w-9 shrink-0 rounded-full shadow-[0_0_0_1px_var(--line)] transition duration-300 group-hover:rotate-6 group-hover:scale-105 sm:h-11 sm:w-11"
          />
          <span className="min-w-0 leading-tight">
            <EditableText k="site.eyebrow" label="Dòng chữ nhỏ trên tên trang" className="hidden text-[11px] uppercase tracking-[0.2em] text-muted sm:block" />
            <EditableText k="site.name" label="Tên trang" className="block truncate font-serif text-base font-semibold text-ink sm:text-lg" />
          </span>
        </Link>

        <nav className="ml-4 hidden gap-1 md:flex">
          {links.map((l) =>
            navLink(l, `rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive(l.href) ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-soft hover:text-ink"
            }`),
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden md:inline-flex">{editToggle}</span>
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

      {/* Thanh menu chính trên điện thoại */}
      <nav className="safe-x flex gap-1 pb-2 md:hidden" aria-label="Menu chính">
        {links.map((l) =>
          navLink(l, `flex-1 rounded-full py-2 text-center text-sm font-medium transition ${
            isActive(l.href) ? "bg-accent-soft text-accent" : "text-ink-soft active:bg-soft"
          }`),
        )}
      </nav>

      {open && (
        <div className="anim-in safe-x max-h-[70vh] overflow-y-auto border-t border-line bg-paper py-3 md:hidden">
          {user ? (
            <>
              <div className="mb-2 flex items-center gap-3 px-3 py-2">
                <Avatar url={profile?.avatar_url} name={profile?.full_name} size={40} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{profile?.full_name || "Tài khoản"}</p>
                  <p className="flex items-center gap-2 truncate text-xs text-muted"><RoleBadge role={role} /> {user.email}</p>
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
              {canEdit && <div className="px-1 py-2">{editToggle}</div>}
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

      {navEdit && <NavEditModal onClose={() => setNavEdit(false)} />}
    </header>
  );
}
