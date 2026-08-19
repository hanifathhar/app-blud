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
