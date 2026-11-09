import { redirect } from "next/navigation";

/** Chuyên mục cũ đã được thay bằng hashtag */
export default function Page() {
  redirect("/thu-vien?tag=v%C4%83n");
}
