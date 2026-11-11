"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SITE_DEFAULTS, normalizeNav, type NavItem, type TextKey } from "@/lib/siteContent";
import { loadSiteSettings, saveSiteSettings } from "@/services/siteSettingsService";

type Values = Record<string, unknown>;
const CACHE_KEY = "site:settings:v1";

export interface SaveStatus {
  kind: "saving" | "saved" | "error";
  text: string;
}

interface SiteCtx {
  text: (k: TextKey) => string;
  nav: NavItem[];
  /** Logo tuỳ chỉnh (URL) — null = logo mặc định */
  logo: string | null;
  canEdit: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  /** Lưu ngay một thay đổi (null = trở về mặc định) */
  update: (key: string, value: unknown) => Promise<void>;
  status: SaveStatus | null;
}

const Ctx = createContext<SiteCtx | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin } = useAuth();
  const [values, setValues] = useState<Values>({});
  const [editMode, setEditModeState] = useState(false);
  const [status, setStatus] = useState<SaveStatus | null>(null);

  // Hiện ngay bản đã lưu trong máy, rồi tải bản mới nhất từ máy chủ
  useEffect(() => {
    try {
      const c = localStorage.getItem(CACHE_KEY);
      if (c) setValues(JSON.parse(c));
    } catch {}
    loadSiteSettings()
      .then((v) => {
        setValues(v);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); } catch {}
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) setEditModeState(false);
  }, [isSuperAdmin]);

  // Thông báo "Đã lưu" tự ẩn sau 2 giây
  useEffect(() => {
    if (status?.kind !== "saved") return;
    const t = setTimeout(() => setStatus(null), 2000);
    return () => clearTimeout(t);
  }, [status]);

  const text = useCallback(
    (k: TextKey) => {
      const v = values[k];
      return typeof v === "string" && v.trim() ? v : SITE_DEFAULTS[k];
    },
    [values],
  );

  const nav = useMemo(() => normalizeNav(values.nav), [values]);
  const logo = typeof values["site.logo"] === "string" && values["site.logo"] ? (values["site.logo"] as string) : null;

  const update = useCallback(
    async (key: string, value: unknown) => {
      if (!user) return;
      const prev = values;
      const next: Values = { ...values };
      if (value === null || value === undefined) delete next[key];
      else next[key] = value;
      setValues(next); // hiện ngay
      setStatus({ kind: "saving", text: "Đang lưu…" });
      try {
        await saveSiteSettings([[key, value ?? null]], user.id);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
        setStatus({ kind: "saved", text: "✓ Đã lưu" });
      } catch (e) {
        setValues(prev);
        setStatus({ kind: "error", text: e instanceof Error ? `Không lưu được: ${e.message}` : "Không lưu được" });
        throw e;
      }
    },
    [user, values],
  );

  const setEditMode = useCallback((v: boolean) => setEditModeState(v && isSuperAdmin), [isSuperAdmin]);

  return (
    <Ctx.Provider value={{ text, nav, logo, canEdit: isSuperAdmin, editMode: editMode && isSuperAdmin, setEditMode, update, status }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSite() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSite phải dùng bên trong SiteSettingsProvider");
  return c;
}
