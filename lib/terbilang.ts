/**
 * Fungsi pembantu konversi bilangan angka ke terbilang Bahasa Indonesia
 */
export function terbilang(angka: number): string {
  const bilangan = [
    "",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
    "sepuluh",
    "sebelas"
  ];

  const num = Math.floor(Math.abs(angka));

  let hasil = "";
  if (num < 12) {
    hasil = bilangan[num];
  } else if (num < 20) {
    hasil = terbilang(num - 10) + " belas";
  } else if (num < 100) {
    hasil = terbilang(Math.floor(num / 10)) + " puluh " + terbilang(num % 10);
  } else if (num < 200) {
    hasil = "seratus " + terbilang(num - 100);
  } else if (num < 1000) {
    hasil = terbilang(Math.floor(num / 100)) + " ratus " + terbilang(num % 100);
  } else if (num < 2000) {
    hasil = "seribu " + terbilang(num - 1000);
  } else if (num < 1000000) {
    hasil = terbilang(Math.floor(num / 1000)) + " ribu " + terbilang(num % 1000);
  } else if (num < 1000000000) {
    hasil = terbilang(Math.floor(num / 1000000)) + " juta " + terbilang(num % 1000000);
  } else if (num < 1000000000000) {
    hasil = terbilang(Math.floor(num / 1000000000)) + " milyar " + terbilang(num % 1000000000);
  } else if (num < 1000000000000000) {
    hasil = terbilang(Math.floor(num / 1000000000000)) + " triliun " + terbilang(num % 1000000000000);
  }

  return hasil.trim().replace(/\s+/g, " ");
}

/**
 * Format terbilang lengkap dengan Rupiah di belakangnya (huruf awal kapital)
 * Contoh: 600000 -> "Enam ratus ribu Rupiah"
 */
export function terbilangRupiah(angka: number): string {
  if (!angka || isNaN(angka) || angka === 0) return "Nol Rupiah";
  const teks = terbilang(angka);
  if (!teks) return "Nol Rupiah";
  const kapital = teks.charAt(0).toUpperCase() + teks.slice(1);
  return `${kapital} Rupiah`;
}
