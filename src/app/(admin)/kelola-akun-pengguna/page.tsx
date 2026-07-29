"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import type { BusinessRegistration, ConsumerRegistration, RegistrationStatus } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";

type ManagedAccount = {
  id: string;
  type: "business" | "consumer";
  displayName: string;
  phoneNumber: string;
  email?: string;
  status: RegistrationStatus;
  raw: BusinessRegistration | ConsumerRegistration;
};

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "Pending",
  verified: "Terverifikasi",
  rejected: "Ditolak",
  suspended: "Disuspend",
};

const STATUS_CLASS: Record<RegistrationStatus, string> = {
  pending: "bg-accent/15 text-accent",
  verified: "bg-success/15 text-success",
  rejected: "bg-error/15 text-error",
  suspended: "bg-error/15 text-error",
};

type PendingAction = { account: ManagedAccount; action: "suspend" | "reactivate" | "delete" };

export default function KelolaAkunPenggunaPage() {
  const [businesses, setBusinesses] = useState<BusinessRegistration[]>([]);
  const [consumers, setConsumers] = useState<ConsumerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => {
    let loadedParts = 0;
    const markLoaded = () => {
      loadedParts += 1;
      if (loadedParts >= 2) setLoading(false);
    };

    const unsubBusiness = onSnapshot(collection(db, "business_registrations"), (snap) => {
      setBusinesses(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BusinessRegistration),
      );
      markLoaded();
    });
    const unsubConsumer = onSnapshot(collection(db, "consumer_registrations"), (snap) => {
      setConsumers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ConsumerRegistration),
      );
      markLoaded();
    });

    return () => {
      unsubBusiness();
      unsubConsumer();
    };
  }, []);

  const accounts = useMemo<ManagedAccount[]>(() => {
    const fromBusiness: ManagedAccount[] = businesses.map((b) => ({
      id: b.id,
      type: "business",
      displayName: b.businessName || b.ownerFullName || "(Tanpa nama)",
      phoneNumber: b.phoneNumber,
      email: b.ownerEmail,
      status: b.status,
      raw: b,
    }));
    const fromConsumer: ManagedAccount[] = consumers.map((c) => ({
      id: c.id,
      type: "consumer",
      displayName: c.phoneNumber || "(Tanpa nomor)",
      phoneNumber: c.phoneNumber,
      status: c.status,
      raw: c,
    }));
    return [...fromBusiness, ...fromConsumer];
  }, [businesses, consumers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) =>
      [a.displayName, a.phoneNumber, a.email]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [accounts, query]);

  async function handleConfirmedAction() {
    if (!pendingAction) return;
    const { account, action } = pendingAction;
    const collectionName =
      account.type === "business" ? "business_registrations" : "consumer_registrations";

    setWorkingId(account.id);
    try {
      if (action === "delete") {
        await deleteDoc(doc(db, collectionName, account.id));
        toast.success("Akun dihapus permanen");
      } else {
        const newStatus: RegistrationStatus = action === "suspend" ? "suspended" : "verified";
        await updateDoc(doc(db, collectionName, account.id), { status: newStatus });
        toast.success(action === "suspend" ? "Akun disuspend" : "Akun diaktifkan kembali");
      }
    } catch {
      toast.error("Gagal memproses akun, coba lagi");
    } finally {
      setWorkingId(null);
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-title text-xl font-bold text-primary">
          Kelola Akun Pengguna
        </h1>
        <p className="mt-1 text-sm text-primary/60">
          Cari & kendalikan akun yang sudah terdaftar, baik BaCoffee Business maupun BaCoffee
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, nomor HP, atau email..."
        className="w-full max-w-md rounded-lg border border-secondary bg-white px-4 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
      />

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex min-h-[30vh] animate-fade-in flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold text-primary">Tidak ada akun ditemukan</p>
          <p className="text-sm text-primary/60">Coba kata kunci lain</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((account) => {
          const isExpanded = expandedId === account.id;
          const isWorking = workingId === account.id;
          return (
            <div
              key={`${account.type}-${account.id}`}
              className="animate-fade-in rounded-xl border border-secondary bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{account.displayName}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary/70">
                      {account.type === "business" ? "Bisnis" : "BaCoffee"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[account.status]}`}
                    >
                      {STATUS_LABEL[account.status]}
                    </span>
                  </div>
                  <p className="text-sm text-primary/60">
                    {account.phoneNumber}
                    {account.email ? ` · ${account.email}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : account.id)}
                    className="rounded-lg border border-secondary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-secondary"
                  >
                    {isExpanded ? "Sembunyikan" : "Lihat Detail"}
                  </button>
                  {account.status === "suspended" ? (
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => setPendingAction({ account, action: "reactivate" })}
                      className="rounded-lg border border-success px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/10 disabled:opacity-50"
                    >
                      Aktifkan Kembali
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => setPendingAction({ account, action: "suspend" })}
                      className="rounded-lg border border-accent px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isWorking}
                    onClick={() => setPendingAction({ account, action: "delete" })}
                    className="rounded-lg border border-error px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-secondary pt-4 text-sm">
                  {account.type === "business" ? (
                    <BusinessDetail data={account.raw as BusinessRegistration} />
                  ) : (
                    <ConsumerDetail data={account.raw as ConsumerRegistration} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction?.action === "delete"
            ? "Hapus akun ini permanen?"
            : pendingAction?.action === "suspend"
              ? "Suspend akun ini?"
              : "Aktifkan kembali akun ini?"
        }
        description={
          pendingAction?.action === "delete"
            ? "Semua data akun ini akan dihapus dari Firestore dan TIDAK BISA dikembalikan lagi."
            : pendingAction?.action === "suspend"
              ? "Akun tidak akan bisa dipakai sampai diaktifkan kembali."
              : "Status akun akan dikembalikan ke Terverifikasi."
        }
        confirmLabel={
          pendingAction?.action === "delete"
            ? "Ya, Hapus Permanen"
            : pendingAction?.action === "suspend"
              ? "Ya, Suspend"
              : "Ya, Aktifkan"
        }
        confirmTone={
          pendingAction?.action === "delete"
            ? "error"
            : pendingAction?.action === "suspend"
              ? "error"
              : "success"
        }
        onConfirm={handleConfirmedAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

// Menampilkan data pendaftaran yang tersimpan asli (bukan "aktivitas" seperti riwayat login/pesanan -
// data semacam itu belum ada sistemnya sama sekali, jadi jujur ditampilkan sesuai yang benar-benar ada).
function BusinessDetail({ data }: { data: BusinessRegistration }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
      <div>
        <dt className="text-primary/50">Pemilik</dt>
        <dd className="text-primary">{data.ownerFullName}</dd>
      </div>
      <div>
        <dt className="text-primary/50">NIK</dt>
        <dd className="text-primary">{data.ownerNik}</dd>
      </div>
      <div>
        <dt className="text-primary/50">NPWP</dt>
        <dd className="text-primary">{data.ownerNpwp}</dd>
      </div>
      <div>
        <dt className="text-primary/50">Kategori Usaha</dt>
        <dd className="text-primary">{data.businessCategory}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-primary/50">Alamat Usaha</dt>
        <dd className="text-primary">{data.businessAddress}</dd>
      </div>
    </dl>
  );
}

function ConsumerDetail({ data }: { data: ConsumerRegistration }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
      <div>
        <dt className="text-primary/50">Nomor HP</dt>
        <dd className="text-primary">{data.phoneNumber}</dd>
      </div>
      <div>
        <dt className="text-primary/50">Status</dt>
        <dd className="text-primary">{STATUS_LABEL[data.status]}</dd>
      </div>
    </dl>
  );
}
