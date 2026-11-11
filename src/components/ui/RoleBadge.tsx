import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/types/profile";

const STYLES: Record<Role, string> = {
  user: "bg-soft text-ink-soft",
  vip: "bg-accent-soft text-accent",
  admin: "bg-blue-500/15 text-blue-500",
  super_admin: "bg-purple-500/15 text-purple-400",
};

export default function RoleBadge({ role, className = "" }: { role?: Role | null; className?: string }) {
  const r: Role = role ?? "user";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[r]} ${className}`}>
      {r === "vip" ? "★ " : ""}{ROLE_LABELS[r]}
    </span>
  );
}
