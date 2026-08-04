"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import EmptyState from "@/components/EmptyState";
import type { BusinessRegistration, ConsumerAccount, FirestoreTimestamp, PlatformBroadcast } from "@/lib/types";

function toDate(ts?: FirestoreTimestamp | null): Date | null {
  return ts ? new Date(ts.seconds * 1000) : null;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// null kalau minggu lalu nol (persentase tidak bermakna dibanding nol) - sama filosofinya
// seperti trendPercent di KeuanganScreen.kt (BB): jujur tidak tampilkan angka daripada
// menampilkan persentase yang menyesatkan.
function weekOverWeekPercent(dates: Date[]): number | null {
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const thisWeek = dates.filter((d) => now - d.getTime() <= oneWeekMs).length;
  const lastWeek = dates.filter((d) => {
    const age = now - d.getTime();
    return age > oneWeekMs && age <= oneWeekMs * 2;
  }).length;
  if (lastWeek === 0) return null;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

function bucketByDay(dates: Date[]): number[] {
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = daysAgo(6 - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return dates.filter((d) => d >= dayStart && d < dayEnd).length;
  });
}

function StatCard({
  label,
  value,
  changePercent,
  loading,
}: {
  label: string;
  value: number;
  changePercent: number | null;
  loading: boolean;
}) {
  return (
    <div className="animate-fade-in rounded-2xl bg-secondary p-6 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-medium text-primary/70">{label}</p>
      {loading ? (
        <div className="mt-3 h-9 w-16 animate-pulse rounded-md bg-primary/10" />
      ) : (
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-3xl font-bold text-accent">{value.toLocaleString("id-ID")}</p>
          {changePercent !== null && (
            <span
              className={`text-xs font-semibold ${changePercent >= 0 ? "text-success" : "text-error"}`}
            >
              {changePercent >= 0 ? "↑" : "↓"} {Math.abs(changePercent)}%
            </span>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-primary/40">Dari minggu lalu</p>
    </div>
  );
}

// Chart digambar manual pakai SVG (bukan library) - konsisten dengan pola BB di batch yang sama
// (hand-rolled Canvas), proyek ini sengaja zero dependency tambahan buat kebutuhan visual kecil.
function GrowthLineChart({
  konsumenSeries,
  pelakuUsahaSeries,
  labels,
}: {
  konsumenSeries: number[];
  pelakuUsahaSeries: number[];
  labels: string[];
}) {
  const width = 600;
  const height = 160;
  const padding = 12;
  const maxValue = Math.max(1, ...konsumenSeries, ...pelakuUsahaSeries);

  const toPoints = (series: number[]) =>
    series
      .map((value, i) => {
        const x = padding + (i * (width - padding * 2)) / (series.length - 1);
        const y = height - padding - (value / maxValue) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="mt-4 w-full">
      <polyline
        points={toPoints(konsumenSeries)}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={toPoints(pelakuUsahaSeries)}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {labels.map((label, i) => {
        const x = padding + (i * (width - padding * 2)) / (labels.length - 1);
        return (
          <text
            key={`${label}-${i}`}
            x={x}
            y={height + 14}
            fontSize={10}
            textAnchor="middle"
            fill="var(--color-primary)"
            opacity={0.5}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function VerificationDonut({ verified, pending, rejected }: { verified: number; pending: number; rejected: number }) {
  const isEmpty = verified + pending + rejected === 0;
  const total = Math.max(1, verified + pending + rejected);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { value: verified, color: "var(--color-success)" },
    { value: pending, color: "var(--color-accent)" },
    { value: rejected, color: "var(--color-error)" },
  ];
  let cumulative = 0;

  // Cincin abu-abu polos + label tengah kalau belum ada satu pun pendaftaran bisnis. Tanpa label
  // ini donut kosong terbaca ambigu - mirip donut yang gagal dirender.
  if (isEmpty) {
    return (
      <div className="relative mx-auto mt-2 h-40 w-40">
        <svg viewBox="0 0 160 160" className="h-40 w-40">
          <circle cx={80} cy={80} r={radius} fill="none" stroke="var(--color-secondary)" strokeWidth={20} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs text-primary/50">
          Belum ada data
        </span>
      </div>
    );
  }

  return (
    <svg viewBox="0 0 160 160" className="mx-auto mt-2 h-40 w-40 -rotate-90">
      <circle cx={80} cy={80} r={radius} fill="none" stroke="var(--color-secondary)" strokeWidth={20} />
      {segments.map((segment, i) => {
        const fraction = segment.value / total;
        const dash = fraction * circumference;
        const offset = -cumulative * circumference;
        cumulative += fraction;
        if (dash === 0) return null;
        return (
          <circle
            key={i}
            cx={80}
            cy={80}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={20}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}

function LegendRow({ colorClass, label, value }: { colorClass: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-primary/70">
        <span className={`h-2 w-2 rounded-full ${colorClass}`} /> {label}
      </span>
      <span className="font-semibold text-primary">{value}</span>
    </div>
  );
}

type ActivityItem = { label: string; sublabel: string; timestamp: Date };

export default function DashboardPage() {
  const [businessDocs, setBusinessDocs] = useState<BusinessRegistration[]>([]);
  const [consumerDocs, setConsumerDocs] = useState<ConsumerAccount[]>([]);
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, "business_registrations"), (snap) => {
        setBusinessDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BusinessRegistration));
        setLoading(false);
      }),
      // `consumers`, bukan `consumer_registrations` - koleksi kedua itu tidak pernah ditulis app
      // konsumen, jadi kartu Konsumen & grafik pertumbuhan selalu nol walau ada akun asli.
      onSnapshot(collection(db, "consumers"), (snap) => {
        setConsumerDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ConsumerAccount));
      }),
      onSnapshot(collection(db, "platform_broadcasts"), (snap) => {
        setBroadcasts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PlatformBroadcast));
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const businessDates = businessDocs.map((d) => toDate(d.submittedAt)).filter((d): d is Date => d !== null);
  // Konsumen pakai `createdAt` (skema `consumers`), bisnis pakai `submittedAt`
  // (skema `business_registrations`) - dua koleksi beda penamaan, sengaja tidak diseragamkan
  // supaya tidak perlu mengubah skema yang sudah dipakai lintas platform.
  const consumerDates = consumerDocs.map((d) => toDate(d.createdAt)).filter((d): d is Date => d !== null);
  const verifiedDates = businessDocs
    .filter((d) => d.status === "verified")
    .map((d) => toDate(d.submittedAt))
    .filter((d): d is Date => d !== null);

  const verifiedBusiness = verifiedDates.length;
  const pendingBusiness = businessDocs.filter((d) => d.status === "pending").length;
  const rejectedBusiness = businessDocs.filter((d) => d.status === "rejected" || d.status === "suspended").length;

  const dayLabels = Array.from({ length: 7 }, (_, i) =>
    daysAgo(6 - i).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }),
  );
  const konsumenSeries = bucketByDay(consumerDates);
  const pelakuUsahaSeries = bucketByDay(businessDates);

  // Aktivitas Terbaru = gabungan event nyata dari 3 koleksi (bukan log fiktif) - setiap baris
  // adalah dokumen sungguhan, cuma ditampilkan sebagai 1 feed gabungan.
  const activity: ActivityItem[] = [
    ...businessDocs.map((d) => ({
      label: d.businessName || d.ownerFullName || d.phoneNumber,
      sublabel: "Mendaftar sebagai pelaku usaha",
      timestamp: toDate(d.submittedAt),
    })),
    ...consumerDocs.map((d) => ({
      label: d.name || d.emailOrPhone || d.id,
      sublabel: "Mendaftar sebagai konsumen",
      timestamp: toDate(d.createdAt),
    })),
    ...broadcasts.map((d) => ({
      label: d.title,
      sublabel: "Broadcast baru dipublikasikan",
      timestamp: toDate(d.createdAt),
    })),
  ]
    .filter((item): item is { label: string; sublabel: string; timestamp: Date } => item.timestamp !== null)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6);

  const recentBroadcasts = [...broadcasts]
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-title text-xl font-bold text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-primary/60">
          Kelola dan pantau seluruh aktivitas BaCoffee Career secara real-time.
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-primary">Ringkasan Utama</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Pengguna"
            value={businessDocs.length + consumerDocs.length}
            changePercent={weekOverWeekPercent([...businessDates, ...consumerDates])}
            loading={loading}
          />
          <StatCard
            label="Konsumen"
            value={consumerDocs.length}
            changePercent={weekOverWeekPercent(consumerDates)}
            loading={loading}
          />
          <StatCard
            label="Pelaku Usaha"
            value={businessDocs.length}
            changePercent={weekOverWeekPercent(businessDates)}
            loading={loading}
          />
          <StatCard
            label="Bisnis Terverifikasi"
            value={verifiedBusiness}
            changePercent={weekOverWeekPercent(verifiedDates)}
            loading={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="animate-fade-in rounded-2xl border border-secondary bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold text-primary">Pertumbuhan Pengguna</h2>
          <p className="text-xs text-primary/50">7 hari terakhir</p>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-primary/70">
              <span className="h-2 w-2 rounded-full bg-accent" /> Konsumen
            </span>
            <span className="flex items-center gap-1.5 text-primary/70">
              <span className="h-2 w-2 rounded-full bg-primary" /> Pelaku Usaha
            </span>
          </div>
          {/* Kalau ke-14 titik (2 seri x 7 hari) semuanya nol, maxValue dipaksa jadi 1 dan kedua
              polyline digambar sebagai garis lurus bertumpuk di dasar grafik - terbaca seperti
              grafik berisi data yang trennya rata, padahal artinya tidak ada pendaftaran sama
              sekali. Grafiknya diganti empty state, bukan dibiarkan menggambar garis palsu. */}
          {konsumenSeries.every((v) => v === 0) && pelakuUsahaSeries.every((v) => v === 0) ? (
            <EmptyState
              title="Belum ada pendaftaran"
              description="Grafik pertumbuhan terbentuk begitu ada akun konsumen atau pelaku usaha yang mendaftar dalam 7 hari terakhir."
            />
          ) : (
            <GrowthLineChart konsumenSeries={konsumenSeries} pelakuUsahaSeries={pelakuUsahaSeries} labels={dayLabels} />
          )}
        </div>

        <div className="animate-fade-in rounded-2xl border border-secondary bg-white p-5">
          <h2 className="font-semibold text-primary">Status Verifikasi Bisnis</h2>
          <VerificationDonut verified={verifiedBusiness} pending={pendingBusiness} rejected={rejectedBusiness} />
          <div className="mt-3 flex flex-col gap-1.5">
            <LegendRow colorClass="bg-success" label="Terverifikasi" value={verifiedBusiness} />
            <LegendRow colorClass="bg-accent" label="Menunggu" value={pendingBusiness} />
            <LegendRow colorClass="bg-error" label="Ditolak" value={rejectedBusiness} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="animate-fade-in rounded-2xl border border-secondary bg-white p-5">
          <h2 className="font-semibold text-primary">Aktivitas Terbaru</h2>
          <div className="mt-3 flex flex-col gap-3">
            {activity.length === 0 && (
              <EmptyState
                compact
                title="Belum ada aktivitas"
                description="Pendaftaran akun dan broadcast baru akan tercatat di sini secara otomatis."
              />
            )}
            {activity.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-primary">{item.label}</p>
                  <p className="text-xs text-primary/50">{item.sublabel}</p>
                </div>
                <span className="shrink-0 text-xs text-primary/40">
                  {item.timestamp.toLocaleDateString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in rounded-2xl border border-secondary bg-white p-5">
          <h2 className="font-semibold text-primary">Notifikasi & Broadcast Terbaru</h2>
          <div className="mt-3 flex flex-col gap-3">
            {recentBroadcasts.length === 0 && (
              <EmptyState
                compact
                title="Belum ada broadcast"
                description="Broadcast yang kamu buat di menu Notifikasi & Broadcast akan tampil di sini."
              />
            )}
            {recentBroadcasts.map((broadcast) => (
              <div key={broadcast.id} className="flex items-start justify-between gap-3 text-sm">
                <p className="min-w-0 truncate font-medium text-primary">{broadcast.title}</p>
                <span className="shrink-0 text-xs text-primary/40">
                  {broadcast.createdAt ? new Date(broadcast.createdAt.seconds * 1000).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
