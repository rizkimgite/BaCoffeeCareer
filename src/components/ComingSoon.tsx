export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="font-title text-2xl font-bold text-primary">{title}</h1>
      <p className="text-sm text-primary/60">Belum tersedia di versi demo</p>
    </div>
  );
}
