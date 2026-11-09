/* Bộ biểu tượng SVG nhỏ gọn dùng cho trình phát nhạc và giao diện */
type P = { className?: string; size?: number };
const base = (size = 20) => ({ width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const, focusable: false as const });

export const PlayIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" /></svg>
);
export const PauseIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor"><rect x="6" y="4.5" width="4.2" height="15" rx="1.2" /><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" /></svg>
);
export const NextIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor"><path d="M6 5.9v12.2a.9.9 0 0 0 1.4.74l8.6-6.1a.9.9 0 0 0 0-1.48L7.4 5.16A.9.9 0 0 0 6 5.9Z" /><rect x="17" y="5" width="2.6" height="14" rx="1.1" /></svg>
);
export const PrevIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor"><path d="M18 5.9v12.2a.9.9 0 0 1-1.4.74l-8.6-6.1a.9.9 0 0 1 0-1.48l8.6-6.1A.9.9 0 0 1 18 5.9Z" /><rect x="4.4" y="5" width="2.6" height="14" rx="1.1" /></svg>
);
export const RepeatIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
);
export const RepeatOneIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /><path d="M11 10h1.2v4" strokeWidth="1.8" /></svg>
);
export const VolumeIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>
);
export const MuteIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" /><path d="m16 9 5 6" /><path d="m21 9-5 6" /></svg>
);
export const MoreIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
);
export const QueueIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h13" /><path d="M3 12h13" /><path d="M3 18h8" /><path d="M19 15v6l-4-3 4-3Z" fill="currentColor" /></svg>
);
export const CloseIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12" /><path d="M18 6 6 18" /></svg>
);
export const MusicNoteIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor"><path d="M9 17.5V6.2a1 1 0 0 1 .76-.97l9-2.25A1 1 0 0 1 20 3.95V15" opacity=".0" /><path d="M18.2 3.1 9.8 5.2A1 1 0 0 0 9 6.2v9.4A3.4 3.4 0 1 0 11 18.7V9.3l5.2-1.3v5.9a3.4 3.4 0 1 0 2 3.1V4.1a1 1 0 0 0-1.3-1Z" /></svg>
);
export const RadioIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" fill="currentColor" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4" /><path d="M7.8 16.2a6 6 0 0 1 0-8.4" /><path d="M19.1 4.9a10 10 0 0 1 0 14.2" /><path d="M4.9 19.1a10 10 0 0 1 0-14.2" /></svg>
);
export const SunIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const MoonIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="currentColor"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a.6.6 0 0 0-.8-.7A9.5 9.5 0 1 0 21.2 15a.6.6 0 0 0-.7-.8Z" /></svg>
);
export const MenuIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const LyricsIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 11h16M4 16h10" /></svg>
);
export const DownloadIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></svg>
);
export const LinkIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
);
