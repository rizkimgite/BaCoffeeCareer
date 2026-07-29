"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/verifikasi-bisnis", label: "Verifikasi Bisnis" },
  { href: "/kelola-akun-pengguna", label: "Kelola Akun Pengguna" },
  { href: "/pengaduan-bisnis", label: "Pengaduan Bisnis" },
  { href: "/pengaduan-bacoffee", label: "Pengaduan BaCoffee" },
  { href: "/riwayat-transaksi", label: "Riwayat Transaksi" },
  { href: "/moderasi-ulasan", label: "Moderasi Ulasan" },
  { href: "/notifikasi-broadcast", label: "Notifikasi & Broadcast" },
  { href: "/laporan-analitik", label: "Laporan & Analitik" },
  { href: "/pengaturan", label: "Pengaturan Admin" },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 z-50 flex w-64 shrink-0 flex-col bg-secondary transition-[left] duration-300 ease-in-out md:static ${
          open ? "left-0" : "-left-64"
        }`}
      >
        <div className="flex items-center gap-2 px-6 py-6">
          <Image
            src="/logo.png"
            alt="BaCoffee"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="font-title text-lg font-bold text-primary">
            BaCoffee <span className="text-accent">Career</span>
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-accent text-white"
                    : "text-primary/80 hover:bg-primary/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
