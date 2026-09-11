import PenerimaanForm from "../../_components/PenerimaanForm";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditPenerimaanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await prisma.tblPenerimaan.findUnique({
    where: { idTerima: parseInt(id) }
  });

  if (!data) {
    notFound();
  }

  if (data.pengesahan === 1) {
    return (
      <div className="p-6">
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#EF4444", marginBottom: "8px" }}>
            🔒 Data Penerimaan Terkunci
          </div>
          <p style={{ color: "#64748B", fontSize: "14px", marginBottom: "20px" }}>
            Data penerimaan ini telah disahkan dalam LPJ dan tidak dapat diubah. Batalkan pengesahan LPJ terlebih dahulu jika ingin mengedit data ini.
          </p>
          <div>
            <a href="/dashboard/penatausahaan/penerimaan" className="btn btn-primary">
              Kembali ke Daftar Penerimaan
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Convert decimal to number/string for client component serialization
  const serializedData = {
    ...data,
    nilai: data.nilai ? Number(data.nilai) : 0,
  };

  return (
    <div className="p-6">
      <PenerimaanForm isEdit={true} initialData={serializedData} />
    </div>
  );
}
