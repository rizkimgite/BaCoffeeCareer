"use client";

import { useAdminSession } from "@/lib/useAdminSession";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const session = useAdminSession();
  const username = session?.username ?? null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Buka menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-secondary md:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M2.5 5h15M2.5 10h15M2.5 15h15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
          {username ? username.charAt(0).toUpperCase() : "A"}
        </div>
        <span className="text-sm font-medium text-primary">
          {username ?? "Admin"}
        </span>
      </div>
    </header>
  );
}
