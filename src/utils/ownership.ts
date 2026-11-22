/**
 * Chỉ giữ các đường dẫn tệp nằm trong thư mục của chủ nội dung (<ownerId>/...).
 * Dùng khi xoá tệp kèm theo bài viết/bài hát/album: tránh xoá nhầm tệp của người khác.
 */
export function ownedPaths(paths: (string | null | undefined)[], ownerId: string): string[] {
  const prefix = `${ownerId}/`;
  return paths.filter((p): p is string => !!p && p.startsWith(prefix) && !p.includes(".."));
}
