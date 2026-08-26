import PenerimaanForm from "../_components/PenerimaanForm";

export const metadata = {
  title: "Tambah Penerimaan BAST",
};

export default function TambahPenerimaanPage() {
  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📦 Tambah BAST</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
          Buat Berita Acara Serah Terima dari proses pengadaan
        </p>
      </div>

      <PenerimaanForm />
    </div>
  );
}
