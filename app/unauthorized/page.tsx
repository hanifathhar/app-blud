export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <h1 className="text-3xl font-bold text-red-600 mb-3">Akses Ditolak</h1>
      <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
    </div>
  );
}
