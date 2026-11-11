"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth({
  children,
  admin = false,
  superAdmin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
  superAdmin?: boolean;
}) {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();

  if (loading) return <p className="py-16 text-center text-muted">Đang tải…</p>;

  if (!user)
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-ink-soft">Vui lòng đăng nhập để tiếp tục.</p>
        <Link href="/login" className="btn btn-primary">Đăng nhập</Link>
      </div>
    );

  if ((admin && !isAdmin) || (superAdmin && !isSuperAdmin))
    return <p className="py-16 text-center text-ink-soft">Bạn không có quyền truy cập trang này.</p>;

  return <>{children}</>;
}
