"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
      className="rounded-full px-3 py-2 text-sm text-muted hover:text-ink"
    >
      Đăng xuất
    </button>
  );
}
