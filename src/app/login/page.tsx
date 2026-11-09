"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="hero-glow mx-auto max-w-md rounded-[2rem] border border-line p-8 shadow-xl">
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent font-serif text-2xl font-bold text-paper">P</span>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">{mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản"}</h1>
        <p className="mt-1 text-sm text-muted">Thư Viện Số Phật Tại Tâm</p>
      </div>
      <button type="button" onClick={() => signInWithGoogle().catch((e) => setMsg({ type: "err", text: e.message }))}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-medium text-paper hover:opacity-90">
        <span className="font-bold">G</span> Đăng nhập với Google
      </button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" /> hoặc dùng email <div className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ và tên" className="field" />}
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="field" />
        <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu (ít nhất 6 ký tự)" className="field" />
        <button disabled={busy} className="w-full rounded-full bg-accent py-3 font-medium text-paper hover:bg-accent-strong disabled:opacity-50">
          {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>
      {msg && <p className={`mt-4 text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}
      <div className="mt-6 flex justify-between text-sm">
        <button type="button" className="text-accent hover:underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(null); }}>
          {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
        {mode === "login" && <button type="button" onClick={handleReset} className="text-muted hover:underline">Quên mật khẩu</button>}
      </div>
    </div>
  );
}
