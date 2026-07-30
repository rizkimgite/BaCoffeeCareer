"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import type { BroadcastRelatedFeature, BroadcastSegment, PlatformBroadcast } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";

const SEGMENT_OPTIONS: { value: BroadcastSegment; label: string }[] = [
  { value: "keduanya", label: "Keduanya" },
  { value: "bisnis", label: "BaCoffee Business" },
  { value: "bacoffee", label: "BaCoffee" },
];

const SEGMENT_BADGE_LABEL: Record<BroadcastSegment, string> = {
  bisnis: "Bisnis",
  bacoffee: "BaCoffee",
  keduanya: "Keduanya",
};

// Opsional - kalau diisi, broadcast otomatis berhenti tampil di BB begitu kedai yang lihat
// sudah punya fitur ini aktif (lihat PlatformBroadcast.isAlreadyOwnedBy di sisi BB).
const RELATED_FEATURE_OPTIONS: { value: BroadcastRelatedFeature; label: string }[] = [
  { value: "monitoring_kedai", label: "Monitoring Kedai" },
  { value: "monitoring_pasar", label: "Monitoring Pasar" },
  { value: "ai_helper", label: "AI Helper" },
  { value: "ads", label: "Langganan Iklan" },
  { value: "bundle_premium", label: "Paket Premium" },
];

const RELATED_FEATURE_LABEL: Record<BroadcastRelatedFeature, string> = Object.fromEntries(
  RELATED_FEATURE_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<BroadcastRelatedFeature, string>;

function toDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

function computeStatus(broadcast: PlatformBroadcast): { label: string; className: string } {
  const now = Date.now();
  const start = broadcast.startAt.seconds * 1000;
  const end = broadcast.expiresAt.seconds * 1000;
  if (now < start) return { label: "Terjadwal", className: "bg-secondary text-primary/70" };
  if (now > end) return { label: "Berakhir", className: "bg-secondary text-primary/50" };
  return { label: "Aktif", className: "bg-success/15 text-success" };
}

export default function NotifikasiBroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformBroadcast | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkTo, setLinkTo] = useState("");
  const [segment, setSegment] = useState<BroadcastSegment>("keduanya");
  const [relatedFeature, setRelatedFeature] = useState<BroadcastRelatedFeature | "">("");
  const [startAt, setStartAt] = useState(() => toDateTimeInputValue(new Date()));
  const [expiresAt, setExpiresAt] = useState(() => toDateTimeInputValue(defaultExpiry()));

  useEffect(() => {
    const q = query(collection(db, "platform_broadcasts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBroadcasts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PlatformBroadcast));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "platform_broadcasts"), {
        title: title.trim(),
        imageUrl: imageUrl.trim(),
        targetSegment: segment,
        linkTo: linkTo.trim() || null,
        relatedFeature: relatedFeature || null,
        startAt: Timestamp.fromDate(new Date(startAt)),
        expiresAt: Timestamp.fromDate(new Date(expiresAt)),
        createdAt: Timestamp.now(),
      });
      toast.success("Broadcast berhasil dipublikasikan");
      setTitle("");
      setImageUrl("");
      setLinkTo("");
      setSegment("keduanya");
      setRelatedFeature("");
      setStartAt(toDateTimeInputValue(new Date()));
      setExpiresAt(toDateTimeInputValue(defaultExpiry()));
    } catch {
      toast.error("Gagal mempublikasikan broadcast, coba lagi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteDoc(doc(db, "platform_broadcasts", deleteTarget.id));
      toast.success("Broadcast dihapus");
    } catch {
      toast.error("Gagal menghapus broadcast, coba lagi");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-title text-xl font-bold text-primary">
          Notifikasi & Broadcast
        </h1>
        <p className="mt-1 text-sm text-primary/60">
          Publikasikan banner promosi yang tampil langsung di dashboard BaCoffee
          Business dan/atau BaCoffee.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-secondary bg-white p-5"
      >
        <h2 className="font-semibold text-primary">Buat Broadcast Baru</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-primary/70">Judul</span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mis. Promo Ulang Tahun BaCoffee"
              className="rounded-lg border border-secondary px-3 py-2 text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-primary/70">URL Gambar Banner</span>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://i.ibb.co/..."
              className="rounded-lg border border-secondary px-3 py-2 text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-primary/70">Mulai Tampil</span>
            <input
              type="datetime-local"
              required
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="rounded-lg border border-secondary px-3 py-2 text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-primary/70">Berakhir</span>
            <input
              type="datetime-local"
              required
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-lg border border-secondary px-3 py-2 text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-primary/70">Link Tujuan (opsional)</span>
            <input
              type="text"
              value={linkTo}
              onChange={(e) => setLinkTo(e.target.value)}
              placeholder="mis. https://... atau nama fitur tujuan"
              className="rounded-lg border border-secondary px-3 py-2 text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-primary/70">Terkait Fitur (opsional)</span>
            <select
              value={relatedFeature}
              onChange={(e) => setRelatedFeature(e.target.value as BroadcastRelatedFeature | "")}
              className="rounded-lg border border-secondary bg-white px-3 py-2 text-primary outline-none focus:border-accent"
            >
              <option value="">Tidak terkait fitur tertentu</option>
              {RELATED_FEATURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-primary/50">
              Kalau diisi, banner otomatis berhenti tampil ke kedai yang sudah punya fitur ini aktif.
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-primary/70">Target Segmen</span>
          <div className="flex flex-wrap gap-3">
            {SEGMENT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  segment === opt.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-secondary text-primary/70 hover:bg-secondary/50"
                }`}
              >
                <input
                  type="radio"
                  name="segment"
                  value={opt.value}
                  checked={segment === opt.value}
                  onChange={() => setSegment(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {imageUrl.trim() && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-pasted URL, can't be allow-listed for next/image
          <img
            src={imageUrl}
            alt="Preview banner"
            className="h-32 w-full rounded-lg object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            onLoad={(e) => {
              e.currentTarget.style.display = "block";
            }}
          />
        )}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Mempublikasikan..." : "Publikasikan Broadcast"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-primary">Broadcast Terpublikasi</h2>

        {loading && <div className="h-24 animate-pulse rounded-2xl bg-secondary/60" />}

        {!loading && broadcasts.length === 0 && (
          <div className="flex min-h-[20vh] animate-fade-in flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-primary/60">
              Belum ada broadcast yang dipublikasikan
            </p>
          </div>
        )}

        {broadcasts.map((broadcast) => {
          const status = computeStatus(broadcast);
          return (
            <div
              key={broadcast.id}
              className="flex animate-fade-in items-center gap-4 rounded-2xl border border-secondary bg-white p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-pasted URL, can't be allow-listed for next/image */}
              <img
                src={broadcast.imageUrl}
                alt={broadcast.title}
                className="h-16 w-24 shrink-0 rounded-lg bg-secondary object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-primary">{broadcast.title}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary/70">
                    {SEGMENT_BADGE_LABEL[broadcast.targetSegment]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                    {status.label}
                  </span>
                  {broadcast.relatedFeature && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                      {RELATED_FEATURE_LABEL[broadcast.relatedFeature]}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-primary/50">
                  {new Date(broadcast.startAt.seconds * 1000).toLocaleDateString("id-ID")} —{" "}
                  {new Date(broadcast.expiresAt.seconds * 1000).toLocaleDateString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                disabled={deletingId === broadcast.id}
                onClick={() => setDeleteTarget(broadcast)}
                className="shrink-0 rounded-lg border border-error px-3 py-2 text-xs font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus broadcast ini?"
        description={`"${deleteTarget?.title ?? ""}" akan hilang dari dashboard semua pengguna terkait secara permanen.`}
        confirmLabel="Ya, Hapus"
        confirmTone="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
