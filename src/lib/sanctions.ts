import { Timestamp } from "firebase/firestore";

// Tangga sanksi konsumen. SATU-SATUNYA tempat aturan tingkat ini ditulis di seluruh ekosistem —
// app konsumen sengaja TIDAK menghafalnya. Di sana yang disimpan cuma tanggal kedaluwarsa mentah
// (`reservationBlockedUntil`, `longRangeBookingBlockedUntil`) dan app hanya membandingkannya dengan
// waktu sekarang. Konsekuensinya: durasi di bawah bisa diubah kapan saja tanpa merilis ulang APK,
// dan tidak ada risiko dua sisi memakai angka yang berbeda diam-diam.
//
// Tingkat ditentukan otomatis dari akumulasi flag, bukan dipilih admin — supaya pelanggaran yang
// sama menghasilkan akibat yang sama, tidak tergantung siapa yang menangani laporannya.

const LONG_RANGE_BLOCK_DAYS = 60; // tingkat 2
const RESERVATION_BLOCK_DAYS = 30; // tingkat 3

function daysFromNow(days: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return Timestamp.fromDate(date);
}

export type SanctionPreview = {
  headline: string;
  detail: string;
};

// Dipakai untuk memberi tahu admin akibat yang AKAN berlaku sebelum dia menekan "Terbukti".
// Keputusan yang bisa menangguhkan akun orang tidak boleh diambil tanpa tahu akibatnya.
export function previewSanction(nextFlagCount: number): SanctionPreview {
  switch (nextFlagCount) {
    case 1:
      return {
        headline: "Flag ke-1 — Peringatan",
        detail:
          "Konsumen menerima peringatan, poin dari transaksi ini dibatalkan, dan hak ulasan untuk transaksi ini ditutup.",
      };
    case 2:
      return {
        headline: "Flag ke-2 — Batasi pemesanan jauh hari",
        detail: `Reservasi lebih dari 7 hari ke depan dinonaktifkan selama ${LONG_RANGE_BLOCK_DAYS} hari. Poin transaksi ini dibatalkan dan hak ulasannya ditutup.`,
      };
    case 3:
      return {
        headline: "Flag ke-3 — Tangguhkan fitur reservasi",
        detail: `Seluruh fitur reservasi ditangguhkan selama ${RESERVATION_BLOCK_DAYS} hari. Konsumen masih bisa membuka aplikasi.`,
      };
    default:
      return {
        headline: `Flag ke-${nextFlagCount} — Tangguhkan akun`,
        detail:
          "Akun ditangguhkan sepenuhnya. Konsumen tidak bisa masuk aplikasi dan hanya bisa dipulihkan lewat peninjauan manual di Kelola Akun Pengguna.",
      };
  }
}

// Field yang ditulis ke dokumen consumers/{id}. Sengaja mengembalikan objek, bukan langsung menulis:
// pemanggil menggabungkannya ke satu batch bersama pembaruan laporan & reservasi, supaya sanksi
// tidak bisa setengah jadi kalau salah satu tulisan gagal.
export function sanctionUpdatesFor(
  nextFlagCount: number,
  reasonLabel: string,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    flagCount: nextFlagCount,
    lastSanctionAt: Timestamp.now(),
  };

  if (nextFlagCount === 2) {
    base.longRangeBookingBlockedUntil = daysFromNow(LONG_RANGE_BLOCK_DAYS);
  } else if (nextFlagCount === 3) {
    base.reservationBlockedUntil = daysFromNow(RESERVATION_BLOCK_DAYS);
  } else if (nextFlagCount >= 4) {
    base.status = "suspended";
    base.suspendedAt = Timestamp.now();
    base.suspensionReason = reasonLabel;
  }

  return base;
}
