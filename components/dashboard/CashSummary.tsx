"use client";

import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
} from "lucide-react";

interface CashSummaryProps {
  kasMasuk: number;
  kasKeluar: number;
  saldo: number;
  loading?: boolean;
}

const rupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);

export default function CashSummary({
  kasMasuk,
  kasKeluar,
  saldo,
  loading = false,
}: CashSummaryProps) {
  const total = kasMasuk + kasKeluar;

  const persenMasuk =
    total === 0 ? 0 : (kasMasuk / total) * 100;

  const persenKeluar =
    total === 0 ? 0 : (kasKeluar / total) * 100;

  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border bg-white shadow-lg">
        <div className="animate-pulse">

          <div className="h-20 bg-red-100" />

          <div className="space-y-4 p-6">

            <div className="h-24 rounded-xl bg-gray-100" />
            <div className="h-24 rounded-xl bg-gray-100" />
            <div className="h-24 rounded-xl bg-gray-100" />

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">

      {/* HEADER */}

      <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-500 p-5 text-white">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-white/20 p-3">

            <Wallet size={24} />

          </div>

          <div>

            <h2 className="text-lg font-bold">
              Kondisi Kas
            </h2>

            <p className="text-sm text-red-100">
              Ringkasan arus kas periode terpilih
            </p>

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="space-y-5 p-6">

        {/* Kas Masuk */}

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-green-600">
                Kas Masuk
              </p>

              <h3 className="mt-1 text-2xl font-bold text-green-700">
                {rupiah(kasMasuk)}
              </h3>

            </div>

            <div className="rounded-2xl bg-green-100 p-3">

              <ArrowDownCircle
                className="text-green-600"
                size={30}
              />

            </div>

          </div>

        </div>

        {/* Kas Keluar */}

        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-red-600">
                Kas Keluar
              </p>

              <h3 className="mt-1 text-2xl font-bold text-red-700">
                {rupiah(kasKeluar)}
              </h3>

            </div>

            <div className="rounded-2xl bg-red-100 p-3">

              <ArrowUpCircle
                className="text-red-600"
                size={30}
              />

            </div>

          </div>

        </div>

        {/* Saldo */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-blue-600">
                Saldo Kas
              </p>

              <h3 className="mt-1 text-3xl font-bold text-blue-700">
                {rupiah(saldo)}
              </h3>

            </div>

            <div className="rounded-2xl bg-blue-100 p-3">

              <Scale
                className="text-blue-600"
                size={30}
              />

            </div>

          </div>

        </div>

        {/* Progress */}

        <div>

          <div className="mb-2 flex justify-between text-sm font-medium">

            <span>Kas Masuk</span>

            <span>{persenMasuk.toFixed(1)}%</span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-200">

            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{
                width: `${persenMasuk}%`,
              }}
            />

          </div>

        </div>

        <div>

          <div className="mb-2 flex justify-between text-sm font-medium">

            <span>Kas Keluar</span>

            <span>{persenKeluar.toFixed(1)}%</span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-200">

            <div
              className="h-full rounded-full bg-red-500 transition-all duration-700"
              style={{
                width: `${persenKeluar}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <div className="border-t bg-gray-50 px-6 py-4">

        <div className="flex items-center justify-between">

          <span className="text-sm text-gray-500">
            Total Arus Kas
          </span>

          <span className="font-bold text-gray-700">
            {rupiah(kasMasuk + kasKeluar)}
          </span>

        </div>

      </div>

    </div>
  );
}