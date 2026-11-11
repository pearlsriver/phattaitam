"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AvatarPicker from "@/components/profile/AvatarPicker";
import Avatar from "@/components/social/Avatar";
import RoleBadge from "@/components/ui/RoleBadge";
import { useAuth } from "@/hooks/useAuth";
import { updateMyProfile } from "@/services/profileService";
import { removeImageUrls, uploadImage } from "@/services/storage";

const NAME_MAX = 80;
const BIO_MAX = 1000;

function ProfileForm() {
  const { user, profile, role, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<{ file: File | null; url: string | null; preview: string | null } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setBio(profile?.bio ?? "");
  }, [profile]);

  const meta = (user?.user_metadata ?? {}) as { avatar_url?: string; picture?: string };
  const googleUrl = meta.avatar_url || meta.picture || null;
  const savedAvatar = profile?.avatar_url ?? null;
  const previewAvatar = avatar ? avatar.preview : savedAvatar;

  const dirty =
    name.trim() !== (profile?.full_name ?? "") ||
    bio.trim() !== (profile?.bio ?? "") ||
    (avatar !== null && (avatar.file !== null || avatar.url !== savedAvatar));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return setMsg({ ok: false, text: "Tên hiển thị không được để trống." });
    setBusy(true);
    setMsg(null);
    let uploaded: string | null = null;
    try {
      let newAvatar = savedAvatar;
      if (avatar) {
        if (avatar.file) {
          uploaded = await uploadImage(avatar.file, user.id, "avatar-");
          newAvatar = uploaded;
        } else {
          newAvatar = avatar.url;
        }
      }
      await updateMyProfile(user.id, { full_name: name, bio, avatar_url: newAvatar });
      // Xoá ảnh đại diện cũ trong kho (bỏ qua ảnh Google / link ngoài)
      if (savedAvatar && savedAvatar !== newAvatar) await removeImageUrls([savedAvatar]);
      if (avatar?.preview?.startsWith("blob:")) URL.revokeObjectURL(avatar.preview);
      setAvatar(null);
      setFormKey((k) => k + 1);
      await refreshProfile();
      setMsg({ ok: true, text: "✓ Đã lưu hồ sơ." });
    } catch (err) {
      if (uploaded) await removeImageUrls([uploaded]);
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Không lưu được" });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (avatar?.preview?.startsWith("blob:")) URL.revokeObjectURL(avatar.preview);
    setAvatar(null);
    setFormKey((k) => k + 1);
    setName(profile?.full_name ?? "");
    setBio(profile?.bio ?? "");
    setMsg(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Tài khoản</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink sm:text-4xl">Hồ sơ của tôi</h1>
        </div>
        {user && <Link href={`/tac-gia/${user.id}`} className="btn btn-secondary !py-2">Xem trang công khai →</Link>}
      </div>

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Ảnh đại diện</h2>
          <AvatarPicker key={formKey} currentUrl={savedAvatar} googleUrl={googleUrl} name={name} onChange={setAvatar} />
        </section>

        <section className="space-y-5 rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-serif text-xl font-semibold text-ink">Thông tin</h2>
          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-medium text-ink">
              Tên hiển thị / nickname <span className="font-normal text-muted">{name.length}/{NAME_MAX}</span>
            </span>
            <input required value={name} onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))} className="field" placeholder="Tên mọi người sẽ thấy" />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-medium text-ink">
              Giới thiệu bản thân <span className="font-normal text-muted">{bio.length}/{BIO_MAX}</span>
            </span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))} rows={7} className="field leading-relaxed"
              placeholder="Vài dòng về bạn: con đường tu học, sở thích, những điều muốn chia sẻ…" />
            <span className="mt-1 block text-xs text-muted">Hiện trên trang tác giả của bạn. Xuống dòng được giữ nguyên.</span>
          </label>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>Email: {user?.email} <span className="text-xs">(không hiển thị công khai)</span></span>
            <span className="flex items-center gap-2">Cấp: <RoleBadge role={role} /></span>
          </div>
        </section>

        {/* Xem trước trang tác giả */}
        <section className="hero-glow rounded-3xl border border-line p-5 sm:p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">Xem trước</p>
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <Avatar url={previewAvatar} name={name} size={88} />
            <div className="min-w-0">
              <p className="font-serif text-2xl font-semibold text-ink">{name.trim() || "(chưa đặt tên)"}</p>
              {bio.trim() ? (
                <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm text-ink-soft">{bio.trim()}</p>
              ) : (
                <p className="mt-1 text-sm text-muted">Chưa có lời giới thiệu.</p>
              )}
            </div>
          </div>
        </section>

        {msg && <p className={msg.ok ? "text-green-500" : "text-red-500"}>{msg.text}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button type="button" onClick={reset} disabled={busy || !dirty} className="btn btn-secondary !py-3">Huỷ thay đổi</button>
          <button disabled={busy || !dirty} className="btn btn-primary !px-7 !py-3 sm:order-first">{busy ? "Đang lưu…" : "Lưu hồ sơ"}</button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return <RequireAuth><ProfileForm /></RequireAuth>;
}
