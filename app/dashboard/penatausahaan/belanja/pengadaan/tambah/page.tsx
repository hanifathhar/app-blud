import PengadaanForm from "../_components/PengadaanForm";

export default function TambahPengadaanPage() {
  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Tambah Pengadaan</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Buat SPK / Kontrak dari permintaan belanja yang telah disetujui</p>
      </div>

      <PengadaanForm />
    </div>
  );
}
