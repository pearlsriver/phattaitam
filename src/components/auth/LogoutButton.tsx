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
      className="btn btn-ghost !py-2"
    >
      Đăng xuất
    </button>
  );
}
