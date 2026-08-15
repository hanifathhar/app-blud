const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dataRaw = await prisma.tblPuk.findMany({ where: { nmSubKegiatan: { contains: 'pendapatan', mode: 'insensitive' } } });
  
  const kdSubkegiatans = Array.from(new Set(dataRaw.map(d => d.kdSubKegiatan).filter(Boolean)));
  const subkegiatans = await prisma.mSubGiat.findMany({
    where: { kd_sub_kegiatan: { in: kdSubkegiatans } }
  });
  
  const kdPrograms = Array.from(new Set(subkegiatans.map(s => s.kd_program?.trim()).filter(Boolean)));
  const kdKegiatans = Array.from(new Set(subkegiatans.map(s => s.kd_kegiatan?.trim()).filter(Boolean)));
  
  const programs = await prisma.mProg.findMany({
    where: { kd_program: { in: kdPrograms } }
  });
  const kegiatans = await prisma.mGiat.findMany({
    where: { kd_kegiatan: { in: kdKegiatans } }
  });
  
  const programMap = new Map(programs.map(p => [p.kd_program?.trim(), p.nm_program]));
  const kegiatanMap = new Map(kegiatans.map(k => [k.kd_kegiatan?.trim(), k.nm_kegiatan]));
  
  const subkegiatanProgramMap = new Map(subkegiatans.map(s => {
    const kd_prog = s.kd_program?.trim();
    const kd_keg = s.kd_kegiatan?.trim();
    return [s.kd_sub_kegiatan?.trim(), {
      kd_program: kd_prog,
      nm_program: kd_prog ? programMap.get(kd_prog) : null,
      kd_kegiatan: kd_keg,
      nm_kegiatan: kd_keg ? kegiatanMap.get(kd_keg) : null
    }];
  }));

  const data = dataRaw.map(d => {
    const related = d.kdSubKegiatan ? subkegiatanProgramMap.get(d.kdSubKegiatan.trim()) : null;
    return {
      noPuk: d.noPuk,
      nmSubKegiatan: d.nmSubKegiatan,
      kdProgram: related?.kd_program || null,
      nmProgram: related?.nm_program || "-",
      kdKegiatan: related?.kd_kegiatan || null,
      nmKegiatan: related?.nm_kegiatan || "-"
    };
  });
  
  console.log(data);
}
main().finally(() => prisma.$disconnect());
