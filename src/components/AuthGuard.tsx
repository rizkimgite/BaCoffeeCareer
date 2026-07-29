"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/lib/useAdminSession";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useAdminSession();

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <p className="animate-fade-in text-sm text-primary/60">Memuat...</p>
      </div>
    );
  }

  return <>{children}</>;
}
