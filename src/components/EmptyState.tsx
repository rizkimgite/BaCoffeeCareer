// Kondisi kosong untuk panel yang datanya memang belum ada - beda maksud dari ComingSoon.tsx.
// ComingSoon = halaman yang sengaja belum dibangun di versi demo; EmptyState = fitur yang sudah
// jalan penuh, cuma datanya belum masuk. Membedakan keduanya penting supaya panel yang sudah
// fungsional tidak terbaca seperti halaman yang belum jadi.
//
// Ikon dikirim sebagai ReactNode (biasanya <svg> inline) - proyek ini tidak punya library ikon
// sama sekali, dan menambah satu cuma untuk ini tidak sepadan.
export default function EmptyState({
  icon,
  title,
  description,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 text-center ${
        compact ? "py-8" : "py-12"
      }`}
    >
      {icon && (
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="max-w-xs text-xs text-primary/60">{description}</p>
    </div>
  );
}
