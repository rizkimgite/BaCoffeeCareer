"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const ok = login(username, password);
    setLoading(false);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError("Nama pengguna atau kata sandi salah");
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-8 shadow-lg shadow-primary/5">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="BaCoffee Career" width={64} height={64} />
          <h1 className="font-title text-xl font-bold text-primary">
            BaCoffee <span className="text-accent">Career</span>
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Nama Pengguna
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-secondary bg-white px-4 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-primary"
            >
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-secondary bg-white px-4 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="animate-fade-in text-sm text-error">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
