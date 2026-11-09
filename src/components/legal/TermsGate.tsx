"use client";

import { useState } from "react";
import TermsContent from "@/components/legal/TermsContent";
import { useAuth } from "@/hooks/useAuth";
import { acceptTerms, signOut } from "@/lib/auth";
import { TERMS_CHECKBOX_TEXT } from "@/lib/terms";

/**
 * Cửa sổ bắt buộc: tài khoản chưa đồng ý Điều lệ (đăng nhập Google lần đầu,
 * hoặc tài khoản cũ) phải tích đồng ý mới được tiếp tục sử dụng website.
 */
export default function TermsGate() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !user || !profile || profile.terms_accepted_at) return null;

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await acceptTerms();
      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không ghi nhận được. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="terms-title">
      <div className="glass anim-in flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl !bg-[var(--surface)] shadow-2xl">
        <div className="border-b border-line px-6 py-4">
          <p id="terms-title" className="font-serif text-xl font-semibold text-ink">Chào mừng bạn đến với Phật Tại Tâm 🙏</p>
          <p className="text-sm text-muted">Vui lòng đọc và đồng ý Điều lệ để tiếp tục.</p>
        </div>
        <div className="overflow-y-auto px-6 py-5"><TermsContent compact /></div>
        <div className="space-y-4 border-t border-line bg-soft/50 px-6 py-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]" />
            <span>{TERMS_CHECKBOX_TEXT}</span>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => signOut()}>Không đồng ý — Đăng xuất</button>
            <button type="button" className="btn btn-primary" disabled={!agree || busy} onClick={accept}>
              {busy ? "Đang ghi nhận…" : "Đồng ý và tiếp tục"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
