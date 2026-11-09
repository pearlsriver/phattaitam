"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Avatar from "@/components/social/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { updateMyProfile } from "@/services/profileService";
import { removeImageUrls, uploadImage } from "@/services/storage";

function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  /** Ảnh đại diện đã tải lên nhưng chưa lưu */
  const pending = useRef<string[]>([]);

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setBio(profile?.bio ?? "");
    setAvatar(profile?.avatar_url ?? null);
  }, [profile]);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user) return;
    setBusy(true);
    setMsg(null);
    try {
      const url = await uploadImage(f, user.id, "avatar-");
      pending.current.push(url);
      setAvatar(url);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Không tải được ảnh" });
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setMsg(null);
    const oldAvatar = profile?.avatar_url ?? null;
    try {
      await updateMyProfile(user.id, { full_name: name, bio, avatar_url: avatar });
      // Xoá ảnh cũ (nếu đã đổi/bỏ) và các ảnh thử nhưng không chọn
      await removeImageUrls([...(oldAvatar !== avatar ? [oldAvatar] : []), ...pending.current.filter((u) => u !== avatar)]);
      pending.current = [];
      await refreshProfile();
      setMsg({ ok: true, text: "Đã lưu hồ sơ." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Không lưu được" });
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    await removeImageUrls(pending.current);
    pending.current = [];
    setAvatar(profile?.avatar_url ?? null);
    setName(profile?.full_name ?? "");
    setBio(profile?.bio ?? "");
    setMsg(null);
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Tài khoản</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Hồ sơ của tôi</h1>
        </div>
        {user && <Link href={`/tac-gia/${user.id}`} className="text-sm text-accent hover:underline">Xem trang công khai →</Link>}
      </div>

      <div className="flex items-center gap-5 rounded-2xl border border-line bg-surface p-5">
        <Avatar url={avatar} name={name} size={88} />
        <div className="space-y-2 text-sm">
          <label className="inline-block cursor-pointer rounded-full border border-line px-4 py-2 text-ink hover:bg-soft">
            {busy ? "Đang tải…" : "📷 Đổi ảnh đại diện"}
            <input type="file" accept="image/*" hidden onChange={pickAvatar} />
          </label>
          {avatar && <button type="button" onClick={() => setAvatar(null)} className="ml-2 text-red-600 hover:underline">Bỏ ảnh</button>}
          <p className="text-xs text-muted">Ảnh vuông, tối đa 10 MB. Ảnh cũ sẽ được xoá khi bạn bấm Lưu.</p>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Tên hiển thị</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="field" maxLength={80} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Giới thiệu</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} maxLength={1000} className="field" placeholder="Vài dòng về bạn…" />
      </label>
      <p className="text-sm text-muted">Email: {user?.email}</p>

      {msg && <p className={msg.ok ? "text-green-600" : "text-red-600"}>{msg.text}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} className="rounded-full bg-ink px-7 py-3 font-medium text-paper disabled:opacity-50">Lưu hồ sơ</button>
        <button type="button" onClick={discard} className="rounded-full border border-line px-6 py-3 text-ink-soft hover:bg-soft">Huỷ thay đổi</button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  return <RequireAuth><ProfileForm /></RequireAuth>;
}
