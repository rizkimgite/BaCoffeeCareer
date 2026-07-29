"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import type { BusinessRegistration } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";

const PHOTO_FIELDS: { key: keyof BusinessRegistration; label: string }[] = [
  { key: "ktpPhotoUrl", label: "KTP" },
  { key: "selfiePhotoUrl", label: "Selfie" },
  { key: "businessFrontPhotoUrl", label: "Foto Depan Usaha" },
  { key: "menuPhotoUrl", label: "Foto Menu" },
];

type ConfirmTarget = { id: string; action: "verified" | "rejected" };

export default function VerifikasiBisnisPage() {
  const [items, setItems] = useState<BusinessRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "business_registrations"),
      where("status", "==", "pending"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as BusinessRegistration,
        ),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleConfirm() {
    if (!confirmTarget) return;
    const { id, action } = confirmTarget;
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "business_registrations", id), {
        status: action,
      });
      toast.success(action === "verified" ? "Bisnis disetujui" : "Bisnis ditolak");
    } catch {
      toast.error("Gagal memperbarui status, coba lagi");
    } finally {
      setUpdatingId(null);
      setConfirmTarget(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-title text-xl font-bold text-primary">
          Verifikasi Bisnis
        </h1>
        <p className="mt-1 text-sm text-primary/60">
          Pendaftaran mitra BaCoffee Business yang menunggu verifikasi
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-secondary/60"
            />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex min-h-[40vh] animate-fade-in flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold text-primary">
            Tidak ada pengajuan pending
          </p>
          <p className="text-sm text-primary/60">
            Semua pendaftaran bisnis sudah diproses
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="animate-fade-in rounded-2xl border border-secondary bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-primary">
                  {item.businessName}
                </h3>
                <p className="text-sm text-primary/60">{item.ownerFullName}</p>
              </div>
              <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                Pending
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-primary/50">NIK</dt>
                <dd className="text-primary">{item.ownerNik}</dd>
              </div>
              <div>
                <dt className="text-primary/50">NPWP</dt>
                <dd className="text-primary">{item.ownerNpwp}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-primary/50">Email</dt>
                <dd className="text-primary">{item.ownerEmail}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-primary/50">Alamat Usaha</dt>
                <dd className="text-primary">{item.businessAddress}</dd>
              </div>
            </dl>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {PHOTO_FIELDS.map((f) => {
                const url = item[f.key] as string | undefined;
                return (
                  <div key={f.label} className="flex flex-col gap-1">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
                      {url ? (
                        <Image
                          src={url}
                          alt={f.label}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-[10px] text-primary/40">
                          Tidak ada
                        </div>
                      )}
                    </div>
                    <span className="text-center text-[10px] text-primary/50">
                      {f.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={updatingId === item.id}
                onClick={() =>
                  setConfirmTarget({ id: item.id, action: "rejected" })
                }
                className="flex-1 rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-50"
              >
                Tolak
              </button>
              <button
                type="button"
                disabled={updatingId === item.id}
                onClick={() =>
                  setConfirmTarget({ id: item.id, action: "verified" })
                }
                className="flex-1 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-50"
              >
                Setujui
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title={
          confirmTarget?.action === "verified"
            ? "Setujui bisnis ini?"
            : "Tolak bisnis ini?"
        }
        description="Tindakan ini akan mengubah status pendaftaran dan tidak bisa dibatalkan dari sini."
        confirmLabel={
          confirmTarget?.action === "verified" ? "Ya, Setujui" : "Ya, Tolak"
        }
        confirmTone={confirmTarget?.action === "verified" ? "success" : "error"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
