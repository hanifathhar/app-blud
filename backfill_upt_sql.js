const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  // Update Pengadaan
  await prisma.$executeRawUnsafe(`
    UPDATE tbl_pengadaan p
    SET nm_upt = u.nm_upt
    FROM ms_upt u
    WHERE p.kd_upt = u.kd_upt AND p.nm_upt IS NULL;
  `);

  // Update PenerimaanBarang
  await prisma.$executeRawUnsafe(`
    UPDATE tbl_penerimaan_barang pb
    SET kd_upt = p.kd_upt, nm_upt = p.nm_upt
    FROM tbl_pengadaan p
    WHERE pb.pengadaan_id = p.id AND pb.kd_upt IS NULL;
  `);

  // Update Tagihan from PermintaanBelanja
  await prisma.$executeRawUnsafe(`
    UPDATE tbl_tagihan t
    SET kd_upt = pb.kd_upt, nm_upt = u.nm_upt
    FROM tbl_permintaan_belanja pb
    LEFT JOIN ms_upt u ON pb.kd_upt = u.kd_upt
    WHERE t.permintaan_belanja_id = pb.id AND t.kd_upt IS NULL;
  `);

  // Update Tagihan from PenerimaanBarang -> Pengadaan
  await prisma.$executeRawUnsafe(`
    UPDATE tbl_tagihan t
    SET kd_upt = p.kd_upt, nm_upt = p.nm_upt
    FROM tbl_penerimaan_barang pb
    JOIN tbl_pengadaan p ON pb.pengadaan_id = p.id
    WHERE t.penerimaan_barang_id = pb.id AND t.kd_upt IS NULL;
  `);

  console.log("Backfill via Raw SQL complete.");
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
