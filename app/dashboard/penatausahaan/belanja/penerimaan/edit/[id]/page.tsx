import PenerimaanForm from "../../_components/PenerimaanForm";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const metadata = {
  title: "Edit Penerimaan BAST",
};

export default async function EditPenerimaanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await prisma.penerimaanBarang.findUnique({
    where: { id: parseInt(resolvedParams.id) },
    include: {
      pengadaan: {
        include: {
          rincian: true,
          permintaan_belanja: true,
        }
      }
    }
  });

  if (!data) {
    return <div>Data tidak ditemukan</div>;
  }

  // Format the data to pass to the form
  const initialData = {
    ...data,
    no_kontrak: data.pengadaan.no_kontrak,
    nm_vendor: data.pengadaan.nm_vendor,
    tgl_kontrak: data.pengadaan.tgl_kontrak,
    nilai_bast: data.pengadaan.nilai_kontrak,
    rincian: data.pengadaan.rincian,
    kd_ukm: data.pengadaan.kd_ukm,
    kd_peruntukan: data.pengadaan.kd_peruntukan,
    kd_komponen: data.pengadaan.kd_komponen,
    kd_rincian: data.pengadaan.kd_rincian,
    kd_sub_kegiatan: data.pengadaan.kd_sub_kegiatan,
    kd_spm: data.pengadaan.kd_spm,
  };

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📦 Edit BAST</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
          Ubah informasi Berita Acara Serah Terima
        </p>
      </div>

      <PenerimaanForm isEdit={true} initialData={initialData} />
    </div>
  );
}
