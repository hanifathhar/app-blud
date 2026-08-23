import PengadaanForm from "../../_components/PengadaanForm";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditPengadaanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return notFound();

  const data = await prisma.pengadaan.findUnique({
    where: { id },
    include: {
      rincian: true,
      permintaan_belanja: true
    }
  });

  if (!data) return notFound();

  const initialData = {
    ...data,
    id: Number(data.id),
    rincian: data.rincian.map((r: any) => ({
      ...r,
      id: Number(r.id),
      total: Number(r.total || 0),
      volume: Number(r.volume || 0),
      harga: Number(r.harga || 0)
    }))
  };

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Ubah Pengadaan</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Edit data SPK / Kontrak yang sedang diproses</p>
      </div>

      <PengadaanForm isEdit={true} initialData={initialData} />
    </div>
  );
}
