"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Avatar from "@/components/social/Avatar";
import RoleBadge from "@/components/ui/RoleBadge";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_ORDER, isAdminRole } from "@/lib/roles";
import { listMembers, renameMember, setMemberRole, type Member } from "@/services/memberService";
import type { Role } from "@/types/profile";
import { formatDate } from "@/utils/formatDate";
import { matchSearch } from "@/utils/slug";

function Members() {
  const { user, role: myRole, refreshProfile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Role | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setMembers(await listMembers());
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Không tải được danh sách thành viên." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isSuper = myRole === "super_admin";
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: members.length };
    for (const r of ROLE_ORDER) c[r] = members.filter((m) => m.role === r).length;
    return c;
  }, [members]);

  const shown = useMemo(
    () => members.filter((m) => (filter === "all" || m.role === filter) && matchSearch(`${m.full_name ?? ""} ${m.email ?? ""}`, q)),
    [members, filter, q],
  );

  /** Các cấp mà người đang đăng nhập được phép chọn cho thành viên này */
  function options(m: Member): Role[] {
    if (isSuper) return ROLE_ORDER;
    if (isAdminRole(m.role)) return [m.role];
    return ["user", "vip"];
  }

  async function changeRole(m: Member, next: Role) {
    if (next === m.role) return;
    const toAdmin = isAdminRole(next) && !isAdminRole(m.role);
    const fromAdmin = isAdminRole(m.role) && !isAdminRole(next);
    const self = m.id === user?.id;
    let question = `Đổi "${m.full_name ?? m.email}" từ ${ROLE_LABELS[m.role]} thành ${ROLE_LABELS[next]}?`;
    if (toAdmin) question += "\n\nNgười này sẽ có quyền quản trị (duyệt/xoá nội dung, quản lý thành viên).";
    if (fromAdmin && self) question += "\n\n⚠ Bạn đang tự hạ quyền của chính mình.";
    if (!confirm(question)) return;

    setBusyId(m.id);
    setMsg(null);
    try {
      await setMemberRole(m.id, next);
      setMsg({ ok: true, text: `Đã đổi ${m.full_name ?? m.email} thành ${ROLE_LABELS[next]}.` });
      await load();
      if (self) await refreshProfile();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Không đổi được cấp." });
    } finally {
      setBusyId(null);
    }
  }

  async function rename(m: Member) {
    const name = prompt("Tên hiển thị mới:", m.full_name ?? "");
    if (name === null) return;
    setBusyId(m.id);
    setMsg(null);
    try {
      await renameMember(m.id, name);
      await load();
      if (m.id === user?.id) await refreshProfile();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Không đổi được tên." });
    } finally {
      setBusyId(null);
    }
  }

  const chip = (k: Role | "all", label: string) => (
    <button key={k} type="button" onClick={() => setFilter(k)} className={`chip !px-3 !py-1 !text-sm ${filter === k ? "chip-on" : ""}`}>
      {label} <span className="opacity-60">{counts[k] ?? 0}</span>
    </button>
  );

  return (
    <div>
      <Link href="/admin" className="text-sm text-accent hover:underline">← Quản trị</Link>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">Thành viên</h1>
      <p className="mt-2 text-ink-soft">
        {isSuper ? "Bạn là Super Admin: đổi được mọi cấp, kể cả cấp/thu hồi quyền Admin." : "Bạn là Admin: đổi được giữa Thành viên mới và VIP."}
      </p>

      <details className="mt-4 rounded-2xl border border-line bg-surface p-4 text-sm">
        <summary className="font-medium text-ink">Quyền của từng cấp</summary>
        <ul className="mt-3 space-y-2">
          {ROLE_ORDER.map((r) => (
            <li key={r} className="flex flex-wrap items-start gap-2"><RoleBadge role={r} /> <span className="text-ink-soft">{ROLE_DESCRIPTIONS[r]}</span></li>
          ))}
        </ul>
      </details>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {chip("all", "Tất cả")}
        {ROLE_ORDER.map((r) => chip(r, ROLE_LABELS[r]))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm theo tên hoặc email…" className="field !w-full !rounded-full sm:ml-auto sm:!w-72" />
      </div>

      {msg && <p className={`mt-4 whitespace-pre-line ${msg.ok ? "text-green-500" : "text-red-500"}`}>{msg.text}</p>}
      {loading && <p className="mt-6 text-muted">Đang tải…</p>}

      <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {shown.map((m) => {
          const opts = options(m);
          const locked = opts.length <= 1;
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar url={m.avatar_url} name={m.full_name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <Link href={`/tac-gia/${m.id}`} className="font-medium text-ink hover:underline">{m.full_name ?? "(chưa đặt tên)"}</Link>
                  <RoleBadge role={m.role} />
                  {m.id === user?.id && <span className="text-xs text-muted">(bạn)</span>}
                </p>
                <p className="truncate text-xs text-muted">{m.email ?? "—"}</p>
                <p className="text-xs text-muted">
                  Tham gia {formatDate(m.created_at)}
                  {m.last_sign_in_at && ` · đăng nhập ${formatDate(m.last_sign_in_at)}`} · {m.post_count} bài viết · {m.song_count} bài hát
                </p>
              </div>
              <select
                value={m.role}
                disabled={locked || busyId === m.id}
                onChange={(e) => changeRole(m, e.target.value as Role)}
                className="field !w-auto !rounded-full !py-1.5 text-sm"
                aria-label={`Cấp của ${m.full_name ?? m.email}`}
                title={locked ? "Chỉ Super Admin đổi được cấp của quản trị viên" : "Đổi cấp"}
              >
                {(locked ? [m.role] : opts).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <button
                type="button"
                className="btn btn-secondary !py-1.5"
                disabled={busyId === m.id || (isAdminRole(m.role) && !isSuper && m.id !== user?.id)}
                onClick={() => rename(m)}
              >
                ✏️ Đổi tên
              </button>
            </div>
          );
        })}
        {!loading && !shown.length && <p className="p-4 text-sm text-muted">Không có thành viên phù hợp.</p>}
      </div>
    </div>
  );
}

export default function MembersPage() {
  return <RequireAuth admin><Members /></RequireAuth>;
}
