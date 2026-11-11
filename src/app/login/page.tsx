"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteLogo from "@/components/site/SiteLogo";
import { useSite } from "@/components/site/SiteSettingsProvider";
import { resetPassword, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth";
import { TERMS_CHECKBOX_TEXT } from "@/lib/terms";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { text } = useSite();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !agree) return setMsg({ type: "err", text: "Bạn cần đồng ý Điều lệ để tạo tài khoản." });
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        router.replace("/dashboard");
      } else {
        const needConfirm = await signUpWithEmail(email, password, name);
        setMsg({ type: "ok", text: needConfirm ? "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản." : "Đăng ký thành công!" });
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Có lỗi xảy ra" });
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email) return setMsg({ type: "err", text: "Nhập email trước rồi bấm Quên mật khẩu." });
    try {
      await resetPassword(email);
      setMsg({ type: "ok", text: "Đã gửi email đặt lại mật khẩu." });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Có lỗi xảy ra" });
    }
  }

  return (
    <div className="hero-glow mx-auto max-w-md rounded-[2rem] border border-line p-6 shadow-xl sm:p-8">
      <div className="text-center">
        <SiteLogo size="sm" className="mx-auto h-[72px] w-[72px] rounded-full" />
        <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">{mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản"}</h1>
        <p className="mt-1 text-sm text-muted">{text("site.eyebrow")} {text("site.name")}</p>
      </div>

      <button type="button" onClick={() => signInWithGoogle().catch((e) => setMsg({ type: "err", text: e.message }))}
        className="btn btn-primary mt-8 w-full !py-3">
        <span className="font-bold">G</span> Tiếp tục với Google
      </button>
      <p className="mt-2 text-center text-xs text-muted">Lần đầu đăng nhập, bạn sẽ được mời đọc và đồng ý <Link href="/dieu-le" target="_blank" className="text-accent hover:underline">Điều lệ</Link>.</p>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" /> hoặc dùng email <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ và tên / nickname" className="field" />}
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="field" />
        <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu (ít nhất 6 ký tự)" className="field" />

        {mode === "signup" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface/60 p-3 text-xs leading-relaxed text-ink-soft">
            <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" />
            <span>
              {TERMS_CHECKBOX_TEXT}{" "}
              <Link href="/dieu-le" target="_blank" className="font-medium text-accent hover:underline">Đọc toàn văn Điều lệ →</Link>
            </span>
          </label>
        )}

        <button disabled={busy || (mode === "signup" && !agree)} className="btn btn-primary w-full !py-3">
          {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>

      {msg && <p className={`mt-4 text-sm ${msg.type === "ok" ? "text-green-500" : "text-red-500"}`}>{msg.text}</p>}

      <div className="mt-6 flex justify-between text-sm">
        <button type="button" className="text-accent hover:underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(null); }}>
          {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
        {mode === "login" && <button type="button" onClick={handleReset} className="text-muted hover:underline">Quên mật khẩu</button>}
      </div>
    </div>
  );
}
