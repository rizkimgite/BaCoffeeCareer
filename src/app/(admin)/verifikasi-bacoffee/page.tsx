"use client";

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
import type { ConsumerRegistration, FirestoreTimestamp } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";

type ConfirmTarget = { id: string; action: "verified" | "rejected" };

function formatDate(ts?: FirestoreTimestamp | null) {
  if (!ts) return "-";
  return new Date(ts.seconds * 1000).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function VerifikasiBaCoffeePage() {
  const [items, setItems] = useState<ConsumerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "consumer_registrations"),
      where("status", "==", "pending"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as ConsumerRegistration,
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
      await updateDoc(doc(db, "consumer_registrations", id), {
        status: action,
      });
      toast.success(
        action === "verified" ? "Pengguna disetujui" : "Pengguna ditolak",
      );
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
          Verifikasi BaCoffee
        </h1>
        <p className="mt-1 text-sm text-primary/60">
          Pendaftaran pengguna BaCoffee yang menunggu verifikasi
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-secondary/60"
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
            Semua pendaftaran pengguna sudah diproses
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex animate-fade-in flex-col gap-3 rounded-xl border border-secondary bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-primary">{item.phoneNumber}</p>
              <p className="text-sm text-primary/60">
                Daftar {formatDate(item.submittedAt)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={updatingId === item.id}
                onClick={() =>
                  setConfirmTarget({ id: item.id, action: "rejected" })
                }
                className="flex-1 rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-50 sm:flex-none"
              >
                Tolak
              </button>
              <button
                type="button"
                disabled={updatingId === item.id}
                onClick={() =>
                  setConfirmTarget({ id: item.id, action: "verified" })
                }
                className="flex-1 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-50 sm:flex-none"
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
            ? "Setujui pengguna ini?"
            : "Tolak pengguna ini?"
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
