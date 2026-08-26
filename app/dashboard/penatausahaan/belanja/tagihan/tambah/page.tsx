import TagihanForm from "../_components/TagihanForm";

export const metadata = {
  title: "Tambah Tagihan (Invoice)",
};

export default function TambahTagihanPage() {
  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>🧾 Tambah Tagihan</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
          Buat tagihan/invoice berdasarkan BAST yang telah diterima
        </p>
      </div>

      <TagihanForm />
    </div>
  );
}
