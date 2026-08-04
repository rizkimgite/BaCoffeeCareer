export type RegistrationStatus = "pending" | "verified" | "rejected" | "suspended";

export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

export type BusinessRegistration = {
  id: string;
  phoneNumber: string;
  ownerFullName: string;
  ownerNik: string;
  ownerNpwp: string;
  ownerEmail: string;
  ktpPhotoUrl?: string;
  selfiePhotoUrl?: string;
  businessFrontPhotoUrl?: string;
  menuPhotoUrl?: string;
  businessName: string;
  businessCategory: string;
  businessNib: string;
  businessAddress: string;
  facilities?: string[];
  status: RegistrationStatus;
  submittedAt?: FirestoreTimestamp | null;
};

// Konsumen punya kosakata status sendiri, TIDAK memakai RegistrationStatus milik bisnis:
// tidak ada proses verifikasi berkas untuk konsumen (akun langsung jadi begitu onboarding selesai),
// jadi "pending"/"verified"/"rejected" tidak punya arti di sini. Yang relevan cuma aktif vs
// disuspend. Ditulis app konsumen (ConsumerStatus.kt), diubah admin lewat Kelola Akun Pengguna.
export type ConsumerStatus = "aktif" | "suspended";

// Mencerminkan dokumen `consumers/{id}` yang benar-benar ditulis app konsumen — id dokumen = nomor
// HP mentah (tanpa +62), konvensi sama dengan business_registrations.
//
// Menggantikan tipe `ConsumerRegistration` lama yang memetakan koleksi `consumer_registrations`:
// koleksi itu ternyata tidak pernah ditulis oleh app konsumen (asumsi lama dari sebelum app-nya
// dibangun), jadi BC tidak pernah bisa melihat akun konsumen asli. Bentuk fieldnya beda total —
// `submittedAt`/`phoneNumber` tidak ada di sini, penggantinya `createdAt` dan doc id/`emailOrPhone`.
export type ConsumerAccount = {
  id: string;
  name: string;
  emailOrPhone?: string;
  status?: ConsumerStatus;
  facilityPreferences?: string[];
  pointsBalance?: number;
  createdAt?: FirestoreTimestamp | null;
};

export type BroadcastSegment = "bisnis" | "bacoffee" | "keduanya";

// "ai_helper" dihapus bersamaan dengan penghapusan fitur AI Helper di BB. Dokumen broadcast lama
// yang terlanjur menyimpan nilai itu masih bisa terbaca dari Firestore (nilainya di luar union
// ini) - lihat fallback label di notifikasi-broadcast/page.tsx.
export type BroadcastRelatedFeature =
  | "monitoring_kedai"
  | "monitoring_pasar"
  | "ads"
  | "bundle_premium";

export type PlatformBroadcast = {
  id: string;
  title: string;
  imageUrl: string;
  targetSegment: BroadcastSegment;
  linkTo?: string | null;
  relatedFeature?: BroadcastRelatedFeature | null;
  startAt: FirestoreTimestamp;
  expiresAt: FirestoreTimestamp;
  createdAt?: FirestoreTimestamp | null;
};
