"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Stats = {
  totalBusiness: number;
  verifiedBusiness: number;
  verifiedConsumer: number;
};

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="animate-fade-in rounded-2xl bg-secondary p-6 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-medium text-primary/70">{label}</p>
      {loading ? (
        <div className="mt-3 h-9 w-16 animate-pulse rounded-md bg-primary/10" />
      ) : (
        <p className="mt-2 text-3xl font-bold text-accent">{value}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalBusiness: 0,
    verifiedBusiness: 0,
    verifiedConsumer: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, "business_registrations"), (snap) => {
        setStats((s) => ({ ...s, totalBusiness: snap.size }));
        setLoading(false);
      }),
      onSnapshot(
        query(
          collection(db, "business_registrations"),
          where("status", "==", "verified"),
        ),
        (snap) => setStats((s) => ({ ...s, verifiedBusiness: snap.size })),
      ),
      onSnapshot(
        query(
          collection(db, "consumer_registrations"),
          where("status", "==", "verified"),
        ),
        (snap) => setStats((s) => ({ ...s, verifiedConsumer: snap.size })),
      ),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-title text-lg font-bold text-primary">
          BaCoffee <span className="text-accent">Business</span>
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Bisnis Daftar"
            value={stats.totalBusiness}
            loading={loading}
          />
          <StatCard
            label="Total Bisnis Terverifikasi"
            value={stats.verifiedBusiness}
            loading={loading}
          />
        </div>
      </div>
      <div>
        <h2 className="font-title text-lg font-bold text-primary">BaCoffee</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Pengguna"
            value={stats.verifiedConsumer}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
