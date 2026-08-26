import TagihanForm from "../../_components/TagihanForm";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const metadata = {
  title: "Edit Tagihan (Invoice)",
};

export default async function EditTagihanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await prisma.tagihan.findUnique({
    where: { id: parseInt(resolvedParams.id) },
    include: {
      rincian: true,
      penerimaan_barang: {
        include: {
          pengadaan: true,
        }
      },
      permintaan_belanja: true,
    }
  });

  if (!data) {
    return <div>Data tidak ditemukan</div>;
  }

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>🧾 Edit Tagihan</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
          Ubah informasi Tagihan/Invoice
        </p>
      </div>

      <TagihanForm isEdit={true} initialData={data} />
    </div>
  );
}
