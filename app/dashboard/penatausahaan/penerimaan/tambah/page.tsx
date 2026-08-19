import PenerimaanForm from "../_components/PenerimaanForm";

export default function TambahPenerimaanPage() {
  return (
    <div className="p-6">
      <PenerimaanForm isEdit={false} />
    </div>
  );
}
