import { redirect } from "next/navigation";

/** Chuyên mục cũ đã được thay bằng hashtag */
export default function Page() {
  redirect("/thu-vien?tag=thi%E1%BB%81n");
}
