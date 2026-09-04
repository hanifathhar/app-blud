import PengeluaranForm from "./_components/PengeluaranForm";

export default function TambahPengeluaranPage() {
  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>💸 Bukukan Pengeluaran</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Pilih tagihan yang sudah diverifikasi untuk dibukukan sebagai pengeluaran</p>
      </div>
      <PengeluaranForm />
    </div>
  );
}
