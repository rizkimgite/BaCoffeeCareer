"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { previewSanction, sanctionUpdatesFor } from "@/lib/sanctions";
import { REPORT_REASON_LABEL, type ConsumerReport, type FirestoreTimestamp } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState from "@/components/EmptyState";

type ConfirmTarget = { report: ConsumerReport; action: "terbukti" | "ditolak"; nextFlagCount: number };

function formatDate(ts?: FirestoreTimestamp | null): string {
  if (!ts) return "-";
  return new Date(ts.seconds * 1000).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PengaduanBisnisPage() {
  const [reports, setReports] = useState<ConsumerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Seluruh laporan dibaca (bukan cuma yang "diajukan") supaya admin bisa melihat riwayat
    // keputusannya sendiri - laporan yang sudah diputus tetap tampil dengan badge hasilnya.
    const unsub = onSnapshot(collection(db, "consumer_reports"), (snap) => {
      setReports(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as ConsumerReport)
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  // Hitungan flag dibaca SAAT tombol ditekan, bukan disimpan di state: dua laporan untuk konsumen
  // yang sama bisa diputus berurutan, dan angka yang dipakai harus yang terbaru.
  async function openConfirm(report: ConsumerReport, action: "terbukti" | "ditolak") {
    if (action === "ditolak") {
      setConfirmTarget({ report, action, nextFlagCount: 0 });
      return;
    }
    const consumerSnap = await getDoc(doc(db, "consumers", report.consumerId));
    const currentFlags = (consumerSnap.data()?.flagCount as number | undefined) ?? 0;
    setConfirmTarget({ report, action, nextFlagCount: currentFlags + 1 });
  }

  async function handleConfirmed() {
    if (!confirmTarget) return;
    const { report, action, nextFlagCount } = confirmTarget;
    setWorkingId(report.id);

    try {
      const batch = writeBatch(db);
      const reportRef = doc(db, "consumer_reports", report.id);

      if (action === "ditolak") {
        batch.update(reportRef, { status: "ditolak", reviewedAt: Timestamp.now() });
        await batch.commit();
        toast.success("Laporan ditolak");
      } else {
        const reasonLabel = REPORT_REASON_LABEL[report.reason] ?? report.reason;

        // Poin dibatalkan HANYA kalau memang pernah cair. points_ledger/{reservationId} adalah
        // buktinya - kalau dokumennya tidak ada, reservasi ini tidak pernah menghasilkan poin
        // (mis. berakhir hangus), jadi tidak ada yang perlu ditarik.
        const ledgerRef = doc(db, "points_ledger", report.reservationId);
        const ledgerSnap = await getDoc(ledgerRef);
        const alreadyReversed = ledgerSnap.exists() && ledgerSnap.data()?.reversedAt != null;
        const pointsToReverse =
          ledgerSnap.exists() && !alreadyReversed ? ((ledgerSnap.data()?.points as number) ?? 0) : 0;

        batch.update(reportRef, {
          status: "terbukti",
          reviewedAt: Timestamp.now(),
          resultingFlagNumber: nextFlagCount,
        });

        // Menutup hak ulasan untuk transaksi ini saja - kunjungan lain tidak terpengaruh.
        batch.update(doc(db, "reservations", report.reservationId), { consumerFlagged: true });

        const consumerUpdates = sanctionUpdatesFor(nextFlagCount, reasonLabel);
        if (pointsToReverse > 0) {
          // Saldo boleh jadi negatif kalau poinnya terlanjur ditukar voucher: voucher yang sudah
          // dipakai di kedai lain tidak ditarik balik, karena itu menyeret pihak ketiga yang tidak
          // bersalah. Pembukuannya tetap jujur - poin yang dibatalkan benar-benar hilang.
          const currentBalance =
            ((await getDoc(doc(db, "consumers", report.consumerId))).data()?.pointsBalance as
              | number
              | undefined) ?? 0;
          consumerUpdates.pointsBalance = currentBalance - pointsToReverse;
          batch.update(ledgerRef, { reversedAt: Timestamp.now() });
        }
        batch.update(doc(db, "consumers", report.consumerId), consumerUpdates);

        await batch.commit();
        toast.success(`Laporan terbukti — ${previewSanction(nextFlagCount).headline}`);
      }
    } catch {
      toast.error("Gagal memproses laporan, coba lagi");
    } finally {
      setWorkingId(null);
      setConfirmTarget(null);
    }
  }

  const pending = reports.filter((r) => r.status === "diajukan");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-title text-xl font-bold text-primary">Pengaduan Bisnis</h1>
        <p className="mt-1 text-sm text-primary/60">
          Laporan kedai atas pelanggaran konsumen. Sanksi berlaku otomatis sesuai akumulasi
          pelanggaran yang terbukti.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <EmptyState
          title="Belum ada laporan"
          description="Laporan yang dikirim kedai lewat BaCoffee Business akan muncul di sini untuk diverifikasi."
        />
      )}

      {!loading && reports.length > 0 && (
        <p className="text-sm text-primary/60">
          {pending.length} laporan menunggu verifikasi dari {reports.length} total laporan.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {reports.map((report) => {
          const isExpanded = expandedId === report.id;
          const isWorking = workingId === report.id;
          return (
            <div
              key={report.id}
              className="animate-fade-in rounded-xl border border-secondary bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-primary">{report.consumerName}</p>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary/70">
                      {REPORT_REASON_LABEL[report.reason] ?? report.reason}
                    </span>
                    <StatusBadge status={report.status} flagNumber={report.resultingFlagNumber} />
                  </div>
                  <p className="mt-1 text-sm text-primary/60">
                    Dilaporkan {report.businessName} • {formatDate(report.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    className="rounded-lg border border-secondary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-secondary"
                  >
                    {isExpanded ? "Sembunyikan" : "Lihat Detail"}
                  </button>
                  {report.status === "diajukan" && (
                    <>
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => openConfirm(report, "ditolak")}
                        className="rounded-lg border border-secondary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-secondary disabled:opacity-50"
                      >
                        Tolak Laporan
                      </button>
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => openConfirm(report, "terbukti")}
                        className="rounded-lg border border-error px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                      >
                        Terbukti
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-secondary pt-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-primary/50">Waktu kunjungan</dt>
                      <dd className="text-primary">{formatDate(report.reservationTime)}</dd>
                    </div>
                    <div>
                      <dt className="text-primary/50">ID Reservasi</dt>
                      <dd className="truncate font-mono text-xs text-primary">
                        {report.reservationId}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-primary/50">Keterangan kedai</dt>
                      {/* Keterangan opsional di sisi BB - tanpa penjagaan ini, laporan yang cuma
                          berisi kategori menampilkan label dengan isi kosong yang terbaca seperti
                          data gagal dimuat. */}
                      <dd className={report.description ? "text-primary" : "text-primary/40"}>
                        {report.description || "Tidak diisi — kedai hanya memilih kategori"}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmed}
        title={
          confirmTarget?.action === "terbukti"
            ? "Nyatakan laporan ini terbukti?"
            : "Tolak laporan ini?"
        }
        description={
          confirmTarget?.action === "terbukti"
            ? `${previewSanction(confirmTarget.nextFlagCount).headline}. ${previewSanction(confirmTarget.nextFlagCount).detail}`
            : "Laporan ditandai tidak terbukti. Tidak ada sanksi apa pun untuk konsumen, dan kedai bisa melihat hasilnya di aplikasi."
        }
        confirmLabel={confirmTarget?.action === "terbukti" ? "Ya, Terapkan Sanksi" : "Ya, Tolak"}
        confirmTone={confirmTarget?.action === "terbukti" ? "error" : "primary"}
      />
    </div>
  );
}

function StatusBadge({ status, flagNumber }: { status: string; flagNumber?: number }) {
  const style =
    status === "terbukti"
      ? "bg-error/15 text-error"
      : status === "ditolak"
        ? "bg-secondary text-primary/60"
        : "bg-accent/15 text-accent";
  const label =
    status === "terbukti"
      ? `Terbukti${flagNumber ? ` — flag ke-${flagNumber}` : ""}`
      : status === "ditolak"
        ? "Ditolak"
        : "Menunggu verifikasi";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>{label}</span>
  );
}
