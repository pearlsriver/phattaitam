import Link from "next/link";

export default function LoginButton() {
  return (
    <Link href="/login" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90">
      Đăng nhập
    </Link>
  );
}
