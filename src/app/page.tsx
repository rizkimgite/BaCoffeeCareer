"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OpeningPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/login"), 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-secondary px-6 text-center">
      <Image
        src="/logo.png"
        alt="BaCoffee Career"
        width={140}
        height={140}
        priority
        className="animate-fade-in"
      />
      <div className="animate-fade-in">
        <h1 className="font-title text-3xl font-extrabold text-primary">
          BaCoffee <span className="text-accent">Career</span>
        </h1>
        <p className="mt-2 text-sm text-primary/70">
          Verifikasi mitra bisnis &amp; pengguna BaCoffee
        </p>
      </div>
      <Link
        href="/login"
        className="animate-fade-in rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        Masuk
      </Link>
    </div>
  );
}
