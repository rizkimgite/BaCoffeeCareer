"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logout } from "@/lib/auth";
import { useAdminSession } from "@/lib/useAdminSession";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const session = useAdminSession();
  const username = session?.username ?? null;
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push("/login");
  }

  function handleUnavailable(label: string) {
    toast(`${label} belum tersedia di versi demo`);
    setMenuOpen(false);
  }

  return (
    <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-secondary bg-white px-4 sm:px-6">
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

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {username ? username.charAt(0).toUpperCase() : "A"}
          </div>
          <span className="text-sm font-medium text-primary">
            {username ?? "Admin"}
          </span>
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="animate-fade-in absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-secondary bg-white shadow-lg">
              <button
                type="button"
                onClick={() => handleUnavailable("Ubah foto profil")}
                className="block w-full px-4 py-2.5 text-left text-sm text-primary/80 transition-colors hover:bg-secondary"
              >
                Ubah Foto Profil
              </button>
              <button
                type="button"
                onClick={() => handleUnavailable("Data diri")}
                className="block w-full px-4 py-2.5 text-left text-sm text-primary/80 transition-colors hover:bg-secondary"
              >
                Data Diri
              </button>
              <div className="border-t border-secondary" />
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-error transition-colors hover:bg-error/10"
              >
                Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
