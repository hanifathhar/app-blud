import re

text1 = """1: generator client {
2:   provider      = "prisma-client-js"
3:   binaryTargets = ["native", "debian-openssl-3.0.x"]
4: }
5: 
6: datasource db {
7:   provider = "postgresql"
8:   url      = env("DATABASE_URL")
9: }
10: 
11: // ==========================================
12: // BLUD Models (dari dbsimblud)
13: // ==========================================
14: 
15: /// Tabel admin / pengelola sistem
16: /// level: 1=superadmin(Dinkes), 2=kpa, 3=perencana, 4=keuangan, 5=bendahara
17: model Admin {
18:   id        Int       @id @default(autoincrement())
19:   nama      String?   @db.VarChar(100)
20:   username  String?   @db.VarChar(100)
21:   password  String?   @db.VarChar(100)
22:   level     Int?
23:   status    Int
24:   tgl_login DateTime?
25:   block     Int
26:   unit      String?   @db.VarChar(50)
27:   email     String?   @db.VarChar(100)
28:   no_telp   String?   @db.VarChar(50)
29: 
30:   @@map("admin")
31: }
32: 
33: /// Master kegiatan
34: model MGiat {
35:   id           Int     @id @default(autoincrement())
36:   kd_kegiatan  String? @db.VarChar(255)
37:   kd_program   String? @db.VarChar(255)
38:   nm_kegiatan  String? @db.Text
39:   jns_kegiatan Float?
40:   lpermen      String? @db.VarChar(255)
41: 
42:   @@map("m_giat")
43: }
44: 
45: /// Master komponen
46: model MKomponen {
47:   id            Int     @id @default(autoincrement())
48:   kd_peruntukan String? @db.VarChar(10)
49:   kd_komponen   String? @db.VarChar(10)
50:   nm_komponen   String? @db.VarChar(225)
51: 
52:   @@map("m_komponen")
53: }
54: 
55: /// Master peruntukan
56: model MPeruntukan {
57:   id            Int     @id @default(autoincrement())
58:   kd_peruntukan String? @db.VarChar(10)
59:   nm_peruntukan String? @db.VarChar(100)
60: 
61:   @@map("m_peruntukan")
62: }
63: 
64: /// Master program
65: model MProg {
66:   id         Int     @id @default(autoincrement())
67:   kd_program String? @db.VarChar(25)
68:   nm_program String? @db.Text
69:   kd_skpd    String? @db.VarChar(25)
70:   lpermen    Int
71:   kd_urusan  String? @db.VarChar(50)
72: 
73:   @@map("m_prog")
74: }
75: 
76: /// Master rincian kegiatan
77: model MRincianKegiatan {
78:   id          Int     @id @default(autoincrement())
79:   kd_komponen String? @db.VarChar(20)
80:   kd_rincian  String? @db.VarChar(20)
81:   nm_rincian  String? @db.VarChar(225)
82: 
83:   @@map("m_rincian_kegiatan")
84: }
85: 
86: /// Master sub kegiatan
87: model MSubGiat {
88:   id              Int     @id @default(autoincrement())
89:   kd_sub_kegiatan String? @db.Char(25)
90:   kd_kegiatan     String? @db.Char(25)
91:   kd_program      String? @db.Char(25)
92:   nm_sub_kegiatan String? @db.VarChar(500)
93: 
94:   @@map("m_sub_giat")
95: }
96: 
97: /// Master UKM
98: model MUkm {
99:   id     Int     @id @default(autoincrement())
100:   kd_ukm String? @db.VarChar(20)
101:   nm_ukm String? @db.VarChar(100)
102: 
103:   @@map("m_ukm")
104: }
105: 
106: /// Master bulan
107: model MsBulan {
108:   id Int     @id @default(autoincrement())
109:   kd Int?
110:   nm String? @db.VarChar(20)
111: 
112:   @@map("ms_bulan")
113: }
114: 
115: /// Master sumber dana
116: model MsDana {
117:   id     Int     @id @default(autoincrement())
118:   sumdan String? @db.VarChar(100)
119: 
120:   @@map("ms_dana")
121: }
122: 
123: /// Master kesesuaian
124: model MsKesesuaian {
125:   id   Int     @id @default(autoincrement())
126:   kode Int?
127:   nama String? @db.VarChar(100)
128: 
129:   @@map("ms_kesesuaian")
130: }
131: 
132: /// Master rekening level 1
133: model MsRek1 {
134:   id       Int     @id @default(autoincrement())
135:   kd_rek1  String? @db.Char(1)
136:   nm_rek1  String? @db.VarChar(50)
137:   kelompok String? @db.Char(1)
138:   lra      String? @db.Char(1)
139: 
140:   @@map("ms_rek1")
141: }
142: 
143: /// Master rekening level 2
144: model MsRek2 {
145:   id       Int     @id @default(autoincrement())
146:   kd_rek2  String? @db.Char(4)
147:   kd_rek1  String? @db.Char(1)
148:   nm_rek2  String? @db.VarChar(50)
149:   kelompok String? @db.Char(4)
150:   lra      String? @db.Char(3)
151: 
152:   @@map("ms_rek2")
153: }
154: 
155: /// Master rekening level 3
156: model MsRek3 {
157:   id       Int     @id @default(autoincrement())
158:   kd_rek3  String? @db.Char(6)
159:   kd_rek2  String? @db.Char(3)
160:   nm_rek3  String? @db.VarChar(100)
161:   kelompok String? @db.Char(6)
162:   lra      String? @db.Char(6)
163: 
164:   @@map("ms_rek3")
165: }
166: 
167: /// Master rekening level 4
168: model MsRek4 {
169:   id       Int     @id @default(autoincrement())
170:   kd_rek4  String? @db.Char(9)
171:   kd_rek3  String? @db.Char(6)
172:   nm_rek4  String? @db.VarChar(250)
173:   kelompok String? @db.Char(10)
174:   rek_lap  String? @db.Char(9)
175: 
176:   @@map("ms_rek4")
177: }
178: 
179: /// Master rekening level 5
180: model MsRek5 {
181:   id       Int     @id @default(autoincrement())
182:   kd_rek5  String? @db.VarChar(12)
183:   kd_rek4  String? @db.VarChar(9)
184:   nm_rek5  String? @db.VarChar(225)
185:   kelompok String? @db.VarChar(7)
186:   rek_lap  String? @db.VarChar(12)
187: 
188:   @@map("ms_rek5")
189: }
190: 
191: /// Master rekening level 6
192: model MsRek6 {
193:   id             Int     @id @default(autoincrement())
194:   kd_rek6        String? @db.VarChar(17)
195:   kd_rek5        String? @db.VarChar(12)
196:   nm_rek6        String? @db.VarChar(350)
197:   map_lo         String? @db.VarChar(17)
198:   piutang_utang  String? @db.VarChar(17)
199:   persed_kdp     String? @db.VarChar(17)
200:   sal_n          String? @db.Char(1)
201:   rek_persediaan String? @db.VarChar(17)
202:   rek_asettetap  String? @db.VarChar(17)
203:   kd_potbank     String? @db.VarChar(50)
204:   status         Int?    @default(0)
205: 
206:   @@map("ms_rek6")
207: }
208: 
209: /// Master jenis SPM
210: model MsSpm {
211:   id     Int     @id @default(autoincrement())
212:   kd_spm Int?
213:   nm_spm String? @db.VarChar(255)
214: 
215:   @@map("ms_spm")
216: }
217: 
218: /// Master UPT / unit pelaksana teknis
219: model MsUpt {
220:   id        Int     @id @default(autoincrement())
221:   kd_upt    String? @db.VarChar(50)
222:   nm_upt    String? @db.VarChar(100)
223:   alamat    String? @db.VarChar(100)
224:   kecamatan String? @db.VarChar(100)
225:   kabupaten String? @db.VarChar(100)
226:   email     String? @db.VarChar(100)
227:   no_tlp    String? @db.VarChar(25)
228:   logo      String? @db.VarChar(100)
229:   type      String? @db.VarChar(100)
230:   ukuran    String? @db.VarChar(100)
231:   status    Int
232: 
233:   @@map("ms_upt")
234: }
235: 
236: /// Master urusan
237: model MsUrusan {
238:   kd_urusan  String  @id @db.VarChar(10)
239:   nm_urusan  String  @db.VarChar(100)
240:   kd_fungsi  String? @db.Char(4)
241:   nm_fungsi  String? @db.VarChar(225)
242:   kd_urusan1 String? @db.VarChar(10)
243:   nm_urusan1 String? @db.VarChar(225)
244:   kd_urusan2 String? @db.VarChar(10)
245:   nm_urusan2 String? @db.VarChar(225)
246: 
247:   @@map("ms_urusan")
248: }
249: 
250: // ==========================================
251: // BLUD Keuangan - Modul Baru
252: // ==========================================
253: 
254: /// Tahun Anggaran (multi-tahun)
255: model TahunAnggaran {
256:   id         Int      @id @default(autoincrement())
257:   tahun      Int      @unique
258:   status     String   @default("aktif") // aktif, tutup
259:   keterangan String?  @db.VarChar(255)
260:   created_at DateTime @default(now())
261: 
262:   rka        RKA[]
263:   dpa        DPA[]
264: 
265:   @@map("tahun_anggaran")
266: }
267: 
268: /// Rencana Kerja Anggaran
269: model RKA {
270:   id              Int       @id @default(autoincrement())
271:   kd_upt          String    @db.VarChar(50)
272:   tahun_id        Int
273:   no_rka          String?   @db.VarChar(50)
274:   kd_program      String?   @db.VarChar(25)
275:   kd_kegiatan     String?   @db.VarChar(255)
276:   kd_sub_kegiatan String?   @db.Char(25)
277:   nm_kegiatan     String?   @db.Text
278:   pagu            Float?
279:   status          String    @default("draft") // draft, diajukan, disetujui, ditolak
280:   keterangan      String?   @db.Text
281:   dibuat_oleh     Int?
282:   disetujui_oleh  Int?
283:   tgl_dibuat      DateTime  @default(now())
284:   tgl_disetujui   DateTime?
285:   updated_at      DateTime  @updatedAt
286: 
287:   tahun    TahunAnggaran @relation(fields: [tahun_id], references: [id])
288:   rincian  RincianRKA[]
289: 
290:   @@map("rka")
291: }
292: 
293: /// Rincian Rencana Kerja Anggaran
294: model RincianRKA {
295:   id           Int     @id @default(autoincrement())
296:   rka_id       Int
297:   kd_rek6      String? @db.VarChar(17)
298:   uraian       String? @db.Text
299:   volume       Float?
300:   satuan       String? @db.VarChar(50)
301:   harga_satuan Float?
302:   jumlah       Float?
303:   kd_dana      String? @db.VarChar(50)
304: 
305:   rka RKA @relation(fields: [rka_id], references: [id], onDelete: Cascade)
306: 
307:   @@map("rincian_rka")
308: }
309: 
310: /// Dokumen Pelaksanaan Anggaran
311: model DPA {
312:   id              Int       @id @default(autoincrement())
313:   kd_upt          String    @db.VarChar(50)
314:   tahun_id        Int
315:   no_dpa          String?   @db.VarChar(50)
316:   kd_program      String?   @db.VarChar(25)
317:   kd_kegiatan     String?   @db.VarChar(255)
318:   kd_sub_kegiatan String?   @db.Char(25)
319:   nm_kegiatan     String?   @db.Text
320:   pagu            Float?
321:   status          String    @default("draft") // draft, diajukan, disetujui, ditolak
322:   keterangan      String?   @db.Text
323:   jenis           String    @default("murni") // murni, perubahan
324:   dibuat_oleh     Int?
325:   disetujui_oleh  Int?
326:   tgl_dibuat      DateTime  @default(now())
327:   tgl_disetujui   DateTime?
328:   updated_at      DateTime  @updatedAt
329: 
330:   tahun    TahunAnggaran @relation(fields: [tahun_id], references: [id])
331:   rincian  RincianDPA[]
332:   spp      SPP[]
333: 
334:   @@map("dpa")
335: }
336: 
337: /// Rincian Dokumen Pelaksanaan Anggaran
338: model RincianDPA {
339:   id           Int     @id @default(autoincrement())
340:   dpa_id       Int
341:   kd_rek6      String? @db.VarChar(17)
342:   uraian       String? @db.Text
343:   volume       Float?
344:   satuan       String? @db.VarChar(50)
345:   harga_satuan Float?
346:   pagu         Float?
347:   realisasi    Float?  @default(0)
348:   kd_dana      String? @db.VarChar(50)
349: 
350:   dpa DPA @relation(fields: [dpa_id], references: [id], onDelete: Cascade)
351: 
352:   @@map("rincian_dpa")
353: }
354: 
355: /// Surat Permintaan Pembayaran
356: model SPP {
357:   id                Int       @id @default(autoincrement())
358:   kd_upt            String    @db.VarChar(50)
359:   dpa_id            Int?
360:   no_spp            String?   @db.VarChar(50)
361:   tgl_spp           DateTime?
362:   jenis_spp         String?   @db.VarChar(10) // UP, GU, TU, LS
363:   uraian            String?   @db.Text
364:   jumlah            Float?
365:   status            String    @default("draft") // draft, diajukan, diverifikasi, disetujui, ditolak
366:   dibuat_oleh       Int?
367:   diverifikasi_oleh Int?
368:   tgl_dibuat        DateTime  @default(now())
369:   keterangan        String?   @db.Text
370:   updated_at        DateTime  @updatedAt
371: 
372:   dpa DPA? @relation(fields: [dpa_id], references: [id])
373:   spm SPM?
374:   tagihan_id        Int?
375:   tagihan           Tagihan? @relation(fields: [tagihan_id], references: [id])
376: 
377:   @@map("spp")
378: }
379: 
380: /// Surat Perintah Membayar
381: model SPM {
382:   id               Int       @id @default(autoincrement())
383:   spp_id           Int       @unique
384:   kd_upt           String    @db.VarChar(50)
385:   no_spm           String?   @db.VarChar(50)
386:   tgl_spm          DateTime?
387:   jumlah           Float?
388:   status           String    @default("draft") // draft, diterbitkan, ditolak
389:   diterbitkan_oleh Int?
390:   tgl_dibuat       DateTime  @default(now())
391:   keterangan       String?   @db.Text
392:   updated_at       DateTime  @updatedAt
393: 
394:   spp  SPP  @relation(fields: [spp_id], references: [id])
395:   sp2d SP2D?
396: 
397:   @@map("spm")
398: }
399: 
400: /// Surat Perintah Pencairan Dana
401: model SP2D {
402:   id           Int       @id @default(autoincrement())
403:   spm_id       Int       @unique
404:   kd_upt       String    @db.VarChar(50)
405:   no_sp2d      String?   @db.VarChar(50)
406:   tgl_sp2d     DateTime?
407:   jumlah       Float?
408:   bank         String?   @db.VarChar(100)
409:   no_rekening  String?   @db.VarChar(50)
410:   status       String    @default("proses") // proses, cair, batal
411:   dicatat_oleh Int?
412:   tgl_dibuat   DateTime  @default(now())
413:   keterangan   String?   @db.Text
414:   updated_at   DateTime  @updatedAt
415: 
416:   spm SPM   @relation(fields: [spm_id], references: [id])
417:   bku BKU[]
418: 
419:   @@map("sp2d")
420: }
421: 
422: /// Buku Kas Umum
423: model BKU {
424:   id            Int       @id @default(autoincrement())
425:   kd_upt        String    @db.VarChar(50)
426:   sp2d_id       Int?
427:   no_bukti      String?   @db.VarChar(50)
428:   tgl_transaksi DateTime?
429:   uraian        String?   @db.Text
430:   debet         Float?    @default(0)
431:   kredit        Float?    @default(0)
432:   saldo         Float?    @default(0)
433:   kd_rek6       String?   @db.VarChar(17)
434:   jenis         String?   @db.VarChar(20) // kas, bank
435:   bulan         Int?
436:   tahun         Int?
437:   dibuat_oleh   Int?
438:   tgl_dibuat    DateTime  @default(now())
439:   updated_at    DateTime  @updatedAt
440: 
441:   sp2d SP2D? @relation(fields: [sp2d_id], references: [id])
442:   tagihan_id    Int?
443:   tagihan       Tagihan? @relation(fields: [tagihan_id], references: [id])
444: 
445:   @@map("bku")
446: }
447: 
448: /// Realisasi Anggaran (rekap per rekening per bulan)
449: model RealisasiAnggaran {
450:   id              Int      @id @default(autoincrement())
451:   kd_upt          String   @db.VarChar(50)
452:   tahun           Int
453:   bulan           Int
454:   kd_program      String?  @db.VarChar(25)
455:   kd_kegiatan     String?  @db.VarChar(255)
456:   kd_sub_kegiatan String?  @db.Char(25)
457:   kd_rek6         String?  @db.VarChar(17)
458:   pagu            Float?   @default(0)
459:   realisasi       Float?   @default(0)
460:   updated_at      DateTime @updatedAt
461: 
462:   @@unique([kd_upt, tahun, bulan, kd_rek6])
463:   @@map("realisasi_anggaran")
464: }
465: 
466: //PUK
467: model TblPuk {
468:   id                 String   @id @db.VarChar(100)
469: 
470:   noPuk              String?  @unique @map("no_puk") @db.VarChar(50)
471: 
472:   kdUkm              String?  @map("kd_ukm") @db.VarChar(20)
473:   nmUkm              String?  @map("nm_ukm") @db.VarChar(100)
474: 
475:   kdPeruntukan       String?  @map("kd_peruntukan") @db.VarChar(20)
476:   nmPeruntukan       String?  @map("nm_peruntukan") @db.VarChar(100)
477: 
478:   kdKomponen         String?  @map("kd_komponen") @db.VarChar(20)
479:   nmKomponen         String?  @map("nm_komponen") @db.VarChar(225)
480: 
481:   kdRincian          String?  @map("kd_rincian") @db.VarChar(20)
482:   nmRincian          String?  @map("nm_rincian") @db.VarChar(225)
483: 
484:   kdSubKegiatan      String?  @map("kd_sub_kegiatan") @db.VarChar(50)
485:   nmSubKegiatan      String?  @map("nm_sub_kegiatan") @db.VarChar(225)
486: 
487:   kdSpm              String?  @map("kd_spm") @db.Char(5)
488:   nmSpm              String?  @map("nm_spm") @db.VarChar(225)
489: 
490:   tujuan             String?  @db.VarChar(225)
491:   sasaran            String?  @db.VarChar(225)
492:   targetSasaran      String?  @map("target_sasaran") @db.VarChar(225)
493:   targetObjek        Int?     @map("target_objek")
494: 
495:   penanggungjawab    String?  @db.VarChar(225)
496: 
497:   nilai              Decimal? @default(0) @db.Decimal(18,2)
498: 
499:   jan                Decimal? @db.Decimal(18,2)
500:   feb                Decimal? @db.Decimal(18,2)
501:   mar                Decimal? @db.Decimal(18,2)
502:   apr                Decimal? @db.Decimal(18,2)
503:   mei                Decimal? @db.Decimal(18,2)
504:   jun                Decimal? @db.Decimal(18,2)
505:   jul                Decimal? @db.Decimal(18,2)
506:   agus               Decimal? @db.Decimal(18,2)
507:   sep                Decimal? @db.Decimal(18,2)
508:   okt                Decimal? @db.Decimal(18,2)
509:   nov                Decimal? @db.Decimal(18,2)
510:   des                Decimal? @db.Decimal(18,2)
511: 
512:   lokasi             String? @db.VarChar(225)
513: 
514:   sumdan             String?  @map("sumdan") @db.VarChar(225)
515: 
516:   username           String?   @db.VarChar(100)
517:   tglUpdate          DateTime? @map("tgl_update")
518:   aksi               String?   @db.VarChar(100)
519:   tahun              String?   @db.VarChar(4)
520: 
521:   kdUpt             String? @map("kd_upt") @db.VarChar(100)
522:   nmUpt             String? @map("nm_upt") @db.VarChar(100)
523: 
524:   rincian            TblPukRincian[]
525: 
526:   @@map("tbl_puk")
527: }
528: 
529: model TblPukRincian {
530: 
531:   id                 Int      @id @default(autoincrement())
532: 
533:   kode               String?  @db.VarChar(100)
534: 
535:   noPuk              String?  @map("no_puk") @db.VarChar(50)
536: 
537:   kdUkm              String?  @map("kd_ukm") @db.VarChar(20)
538:   nmUkm              String?  @map("nm_ukm") @db.VarChar(100)
539: 
540:   kdPeruntukan       String?  @map("kd_peruntukan") @db.VarChar(20)
541:   nmPeruntukan       String?  @map("nm_peruntukan") @db.VarChar(100)
542: 
543:   kdKomponen         String?  @map("kd_komponen") @db.VarChar(20)
544:   nmKomponen         String?  @map("nm_komponen") @db.VarChar(225)
545: 
546:   kdRincian          String?  @map("kd_rincian") @db.VarChar(20)
547:   nmRincian          String?  @map("nm_rincian") @db.VarChar(225)
548: 
549:   kdSubKegiatan      String?  @map("kd_sub_kegiatan") @db.VarChar(50)
550:   nmSubKegiatan      String?  @map("nm_sub_kegiatan") @db.VarChar(225)
551: 
552:   kdSpm              String?  @map("kd_spm") @db.Char(5)
553:   nmSpm              String?  @map("nm_spm") @db.VarChar(225)
554: 
555:   tujuan             String?  @db.VarChar(225)
556:   sasaran            String?  @db.VarChar(225)
557: 
558:   targetSasaran      String?  @map("target_sasaran") @db.VarChar(225)
559:   targetObjek        Int?     @map("target_objek")
560: 
561:   penanggungjawab    String?  @db.VarChar(225)
562: 
563:   uraian             String?  @db.VarChar(225)
564: 
565:   volume             Decimal? @db.Decimal(18,0)
566: 
567:   satuan             String? @db.VarChar(100)
568: 
569:   harga              Decimal? @db.Decimal(18,2)
570: 
571:   total              Decimal? @db.Decimal(18,2)
572: 
573:   jan                Decimal? @db.Decimal(18,2)
574:   feb                Decimal? @db.Decimal(18,2)
575:   mar                Decimal? @db.Decimal(18,2)
576:   apr                Decimal? @db.Decimal(18,2)
577:   mei                Decimal? @db.Decimal(18,2)
578:   jun                Decimal? @db.Decimal(18,2)
579:   jul                Decimal? @db.Decimal(18,2)
580:   agus               Decimal? @db.Decimal(18,2)
581:   sep                Decimal? @db.Decimal(18,2)
582:   okt                Decimal? @db.Decimal(18,2)
583:   nov                Decimal? @db.Decimal(18,2)
584:   des                Decimal? @db.Decimal(18,2)
585: 
586:   lokasi             String? @db.VarChar(225)
587: 
588:   sumdan             String?  @map("sumdan") @db.VarChar(225)
589: 
590:   username           String?   @db.VarChar(100)
591:   tglUpdate          DateTime? @map("tgl_update")
592:   aksi               String?   @db.VarChar(100)
593:   tahun              String?   @db.VarChar(4)
594: 
595:   kdUnit             String? @map("kd_upt") @db.VarChar(100)
596:   nmUnit             String? @map("nm_upt") @db.VarChar(100)
597: 
598:   puk TblPuk? @relation(fields: [noPuk], references: [noPuk])
599: 
600:   @@index([noPuk])
601:   @@map("tbl_puk_rincian")
602: }
603: 
604: //RBA
605: model TblRba {
606:   id                 BigInt    @id @default(autoincrement())
607: 
608:   no_rba             String   @unique @db.VarChar(100)
609:   noPuk              String?  @map("no_puk") @db.VarChar(50)
610: 
611:   kdUkm              String?  @map("kd_ukm") @db.VarChar(20)
612:   nmUkm              String?  @map("nm_ukm") @db.VarChar(100)
613: 
614:   kdPeruntukan       String?  @map("kd_peruntukan") @db.VarChar(20)
615:   nmPeruntukan       String?  @map("nm_peruntukan") @db.VarChar(100)
616: 
617:   kdKomponen         String?  @map("kd_komponen") @db.VarChar(20)
618:   nmKomponen         String?  @map("nm_komponen") @db.VarChar(225)
619: 
620:   kdRincian          String?  @map("kd_rincian") @db.VarChar(20)
621:   nmRincian          String?  @map("nm_rincian") @db.VarChar(225)
622: 
623:   kdSubKegiatan      String?  @map("kd_sub_kegiatan") @db.VarChar(50)
624:   nmSubKegiatan      String?  @map("nm_sub_kegiatan") @db.VarChar(225)
625: 
626:   kdSpm              String?  @map("kd_spm") @db.Char(5)
627:   nmSpm              String?  @map("nm_spm") @db.VarChar(225)
628: 
629: 
630:   kd_rek6            String?   @db.VarChar(50)
631:   nm_rek6            String?   @db.VarChar(100)
632: 
633:   nilai              Decimal   @default(0.00) @db.Decimal(18,2)
634: 
635:   jan                Decimal?  @db.Decimal(18,2)
636:   feb                Decimal?  @db.Decimal(18,2)
637:   mar                Decimal?  @db.Decimal(18,2)
638:   apr                Decimal?  @db.Decimal(18,2)
639:   mei                Decimal?  @db.Decimal(18,2)
640:   jun                Decimal?  @db.Decimal(18,2)
641:   jul                Decimal?  @db.Decimal(18,2)
642:   agus               Decimal?  @db.Decimal(18,2)
643:   sep                Decimal?  @db.Decimal(18,2)
644:   okt                Decimal?  @db.Decimal(18,2)
645:   nov                Decimal?  @db.Decimal(18,2)
646:   des                Decimal?  @db.Decimal(18,2)
647: 
648:   lokasi             String?   @db.VarChar(225)
649: 
650:   sumdan             String?  @map("sumdan") @db.VarChar(225)
651: 
652:   tujuan             String?   @db.VarChar(225)
653:   sasaran            String?   @db.VarChar(225)
654:   target_sasaran     String?   @db.VarChar(225)
655: 
656:   username           String?   @db.VarChar(100)
657:   penanggungjawab    String?   @db.VarChar(225)
658: 
659:   tgl_update         DateTime?
660:   aksi               String?   @db.VarChar(100)
661: 
662:   tahun              String?   @db.VarChar(4)
663: 
664:   kdUnit             String? @map("kd_upt") @db.VarChar(100)
665:   nmUnit             String? @map("nm_upt") @db.VarChar(100)
666: 
667:   rincian            TblRbaRincian[]
668: 
669:   @@map("tbl_rba")
670: }
671: 
672: model TblRbaRincian {
673:   id                 BigInt    @id @default(autoincrement())
674:   no_rba             String    @db.VarChar(100)
675:   noPuk              String?  @map("no_puk") @db.VarChar(50)
676: 
677:   kdUkm              String?  @map("kd_ukm") @db.VarChar(20)
678:   nmUkm              String?  @map("nm_ukm") @db.VarChar(100)
679: 
680:   kdPeruntukan       String?  @map("kd_peruntukan") @db.VarChar(20)
681:   nmPeruntukan       String?  @map("nm_peruntukan") @db.VarChar(100)
682: 
683:   kdKomponen         String?  @map("kd_komponen") @db.VarChar(20)
684:   nmKomponen         String?  @map("nm_komponen") @db.VarChar(225)
685: 
686:   kdRincian          String?  @map("kd_rincian") @db.VarChar(20)
687:   nmRincian          String?  @map("nm_rincian") @db.VarChar(225)
688: 
689:   kdSubKegiatan      String?  @map("kd_sub_kegiatan") @db.VarChar(50)
690:   nmSubKegiatan      String?  @map("nm_sub_kegiatan") @db.VarChar(225)
691: 
692:   kdSpm              String?  @map("kd_spm") @db.Char(5)
693:   nmSpm              String?  @map("nm_spm") @db.VarChar(225)
694: 
695:   kd_rek6            String?   @db.VarChar(50)
696:   nm_rek6            String?   @db.VarChar(100)
697: 
698:   uraian             String?   @db.VarChar(225)
699: 
700:   volume             Decimal?  @db.Decimal(18,0)
701: 
702:   satuan             String?   @db.VarChar(100)
703: 
704:   nilai              Decimal   @default(0.00) @db.Decimal(18,2)
705: 
706:   total              Decimal?  @db.Decimal(18,2)
707: 
708:   jan                Decimal?  @db.Decimal(18,2)
709:   feb                Decimal?  @db.Decimal(18,2)
710:   mar                Decimal?  @db.Decimal(18,2)
711:   apr                Decimal?  @db.Decimal(18,2)
712:   mei                Decimal?  @db.Decimal(18,2)
713:   jun                Decimal?  @db.Decimal(18,2)
714:   jul                Decimal?  @db.Decimal(18,2)
715:   agus               Decimal?  @db.Decimal(18,2)
716:   sep                Decimal?  @db.Decimal(18,2)
717:   okt                Decimal?  @db.Decimal(18,2)
718:   nov                Decimal?  @db.Decimal(18,2)
719:   des                Decimal?  @db.Decimal(18,2)
720: 
721:   username           String?   @db.VarChar(100)
722:   tgl_update         DateTime?
723:   aksi               String?   @db.VarChar(100)
724: 
725:   tahun              String?   @db.VarChar(4)
726: 
727:   kdUnit             String? @map("kd_upt") @db.VarChar(100)
728:   nmUnit             String? @map("nm_upt") @db.VarChar(100)
729: 
730: 
731:   sumdan             String?  @map("sumdan") @db.VarChar(225)
732: 
733:   rba                TblRba @relation(fields: [no_rba], references: [no_rba], onDelete: Cascade)
734: 
735:   @@index([no_rba])
736:   @@map("tbl_rba_rincian")
737: }
738: 
739: // RBA Penetapan
740: model TblRbaPenetapan {
741:   id                 BigInt    @id @default(autoincrement())
742:   nomor_penetapan    String    @db.VarChar(100)
743:   tanggal_penetapan  DateTime?
744:   keterangan         String?   @db.VarChar(255)
745:   no_rba             String    @db.VarChar(100)
746:   noPuk              String?  @map("no_puk") @db.VarChar(50)
747: 
748:   kdUkm              String?  @map("kd_ukm") @db.VarChar(20)
749:   nmUkm              String?  @map("nm_ukm") @db.VarChar(100)
750: 
751:   kdPeruntukan       String?  @map("kd_peruntukan") @db.VarChar(20)
752:   nmPeruntukan       String?  @map("nm_peruntukan") @db.VarChar(100)
753: 
754:   kdKomponen         String?  @map("kd_komponen") @db.VarChar(20)
755:   nmKomponen         String?  @map("nm_komponen") @db.VarChar(225)
756: 
757:   kdRincian          String?  @map("kd_rincian") @db.VarChar(20)
758:   nmRincian          String?  @map("nm_rincian") @db.VarChar(225)
759: 
760:   kdSubKegiatan      String?  @map("kd_sub_kegiatan") @db.VarChar(50)
761:   nmSubKegiatan      String?  @map("nm_sub_kegiatan") @db.VarChar(225)
762: 
763:   kdSpm              String?  @map("kd_spm") @db.Char(5)
764:   nmSpm              String?  @map("nm_spm") @db.VarChar(225)
765: 
766:   kd_rek6            String?   @db.VarChar(50)
767:   nm_rek6            String?   @db.VarChar(100)
768: 
769:   nilai              Decimal   @default(0.00) @db.Decimal(18,2)
770: 
771:   jan                Decimal?  @db.Decimal(18,2)
772:   feb                Decimal?  @db.Decimal(18,2)
773:   mar                Decimal?  @db.Decimal(18,2)
774:   apr                Decimal?  @db.Decimal(18,2)
775:   mei                Decimal?  @db.Decimal(18,2)
776:   jun                Decimal?  @db.Decimal(18,2)
777:   jul                Decimal?  @db.Decimal(18,2)
778:   agus               Decimal?  @db.Decimal(18,2)
779:   sep                Decimal?  @db.Decimal(18,2)
780:   okt                Decimal?  @db.Decimal(18,2)
781:   nov                Decimal?  @db.Decimal(18,2)
782:   des                Decimal?  @db.Decimal(18,2)
783: 
784:   lokasi             String?   @db.VarChar(225)
785:   sumdan             String?  @map("sumdan") @db.VarChar(225)
786:   tujuan             String?   @db.VarChar(225)
787:   sasaran            String?   @db.VarChar(225)
788:   target_sasaran     String?   @db.VarChar(225)
789:   username           String?   @db.VarChar(100)
790:   penanggungjawab    String?   @db.VarChar(225)
791:   tgl_update         DateTime? @default(now())
792:   aksi               String?   @db.VarChar(100)
793:   tahun              String?   @db.VarChar(4)
794:   kdUnit             String? @map("kd_upt") @db.VarChar(100)
795:   nmUnit             String? @map("nm_upt") @db.VarChar(100)
796:   is_aktif           Boolean   @default(false)
797:   rincian            TblRbaRincianPenetapan[]
798: 
799:   @@unique([no_rba, nomor_penetapan])
800:   @@map("tbl_rba_penetapan")
"""
text2 = """801: }
802: 
803: model TblRbaRincianPenetapan {
804:   id                 BigInt    @id @default(autoincrement())
805:   nomor_penetapan    String    @db.VarChar(100)
806:   tanggal_penetapan  DateTime?
807:   keterangan         String?   @db.VarChar(255)
808:   no_rba             String    @db.VarChar(100)
809:   noPuk              String?  @map("no_puk") @db.VarChar(50)
810:   kdUkm              String?  @map("kd_ukm") @db.VarChar(20)
811:   nmUkm              String?  @map("nm_ukm") @db.VarChar(100)
812:   kdPeruntukan       String?  @map("kd_peruntukan") @db.VarChar(20)
813:   nmPeruntukan       String?  @map("nm_peruntukan") @db.VarChar(100)
814:   kdKomponen         String?  @map("kd_komponen") @db.VarChar(20)
815:   nmKomponen         String?  @map("nm_komponen") @db.VarChar(225)
816:   kdRincian          String?  @map("kd_rincian") @db.VarChar(20)
817:   nmRincian          String?  @map("nm_rincian") @db.VarChar(225)
818:   kdSubKegiatan      String?  @map("kd_sub_kegiatan") @db.VarChar(50)
819:   nmSubKegiatan      String?  @map("nm_sub_kegiatan") @db.VarChar(225)
820:   kdSpm              String?  @map("kd_spm") @db.Char(5)
821:   nmSpm              String?  @map("nm_spm") @db.VarChar(225)
822:   kd_rek6            String?   @db.VarChar(50)
823:   nm_rek6            String?   @db.VarChar(100)
824:   uraian             String?   @db.VarChar(225)
825:   volume             Decimal?  @db.Decimal(18,0)
826:   satuan             String?   @db.VarChar(100)
827:   nilai              Decimal   @default(0.00) @db.Decimal(18,2)
828:   total              Decimal?  @db.Decimal(18,2)
829:   jan                Decimal?  @db.Decimal(18,2)
830:   feb                Decimal?  @db.Decimal(18,2)
831:   mar                Decimal?  @db.Decimal(18,2)
832:   apr                Decimal?  @db.Decimal(18,2)
833:   mei                Decimal?  @db.Decimal(18,2)
834:   jun                Decimal?  @db.Decimal(18,2)
835:   jul                Decimal?  @db.Decimal(18,2)
836:   agus               Decimal?  @db.Decimal(18,2)
837:   sep                Decimal?  @db.Decimal(18,2)
838:   okt                Decimal?  @db.Decimal(18,2)
839:   nov                Decimal?  @db.Decimal(18,2)
840:   des                Decimal?  @db.Decimal(18,2)
841:   username           String?   @db.VarChar(100)
842:   tgl_update         DateTime? @default(now())
843:   aksi               String?   @db.VarChar(100)
844:   tahun              String?   @db.VarChar(4)
845:   kdUnit             String? @map("kd_upt") @db.VarChar(100)
846:   nmUnit             String? @map("nm_upt") @db.VarChar(100)
847:   sumdan             String?  @map("sumdan") @db.VarChar(225)
848:   rba_penetapan      TblRbaPenetapan @relation(fields: [no_rba, nomor_penetapan], references: [no_rba, nomor_penetapan], onDelete: Cascade)
849: 
850:   @@index([no_rba])
851:   @@index([nomor_penetapan])
852:   @@map("tbl_rba_rincian_penetapan")
853: }
854: 
855: // SILPA Tahun Lalu
856: model TblSilpa {
857:   id                Int       @id @default(autoincrement())
858:   kd_upt            String    @db.VarChar(50)
859:   nm_upt            String?   @db.VarChar(100)
860:   tahun             String    @db.VarChar(4)
861:   kd_rek6           String    @db.VarChar(50)
862:   nm_rek6           String    @db.VarChar(100)
863:   nilai             Decimal   @default(0.00) @db.Decimal(18,2)
864:   status            String    @default("draft") // draft, ditetapkan
865:   nomor_penetapan   String?   @db.VarChar(100)
866:   tanggal_penetapan DateTime?
867:   dibuat_oleh       String?   @db.VarChar(100)
868:   tgl_dibuat        DateTime  @default(now())
869:   tgl_update        DateTime? @updatedAt
870: 
871:   @@unique([kd_upt, tahun, kd_rek6])
872:   @@map("tbl_silpa")
873: }
874: 
875: 
876: model TblPenerimaan {
877:   idTerima        Int       @id @default(autoincrement()) @map("id_terima")
878: 
879:   noBukti         String?   @map("no_bukti") @db.VarChar(100)
880:   tglBukti        DateTime? @map("tgl_bukti") @db.Date
881: 
882:   kdUnit          String? @map("kd_upt") @db.VarChar(100)
883:   nmUnit          String? @map("nm_upt") @db.VarChar(100)
884: 
885:   kdSubKegiatan   String?   @map("kd_sub_kegiatan") @db.VarChar(25)
886:   nmSubKegiatan   String?   @map("nm_sub_kegiatan") @db.VarChar(225)
887: 
888:   kdRek6          String?   @map("kd_rek6") @db.VarChar(50)
889:   nmRek6          String?   @map("nm_rek6") @db.VarChar(100)
890: 
891:   nilai           Decimal?  @db.Decimal(18, 2)
892: 
893:   keterangan      String?   @db.VarChar(225)
894:   nmPenyetor      String?   @map("nm_penyetor") @db.VarChar(100)
895: 
896:   username        String?   @db.VarChar(100)
897: 
898:   tglUpdate       DateTime? @map("tgl_update")
899:   aksi            String?   @db.VarChar(100)
900: 
901:   jenis           String?   @db.VarChar(1)
902: 
903:   tahun           String?   @db.Char(4)
904: 
905:   verif           Int       @default(0)
906:   tglVerif        DateTime? @map("tgl_verif")
907:   userVerif       String?   @map("user_verif") @db.VarChar(100)
908: 
909:   pengesahan      Int       @default(0)
910: 
911:   sumdan          String?  @map("sumdan") @db.VarChar(225)
912: 
913:   @@index([kdUnit])
914:   @@index([tahun])
915:   @@index([tglBukti])
916:   @@index([kdRek6])
917:   @@index([sumdan])
918:   @@index([verif])
919:   @@index([pengesahan])
920: 
921:   @@map("tbl_penerimaan")
922: }
923: 
924: // ==========================================
925: // Penatausahaan Belanja (Procure to Pay)
926: // ==========================================
927: 
928: model PermintaanBelanja {
929:   id              Int       @id @default(autoincrement())
930:   kd_upt          String    @db.VarChar(50)
931:   tahun           String    @db.VarChar(4)
932:   no_permintaan   String    @unique @db.VarChar(100)
933:   tgl_permintaan  DateTime
934:   
935:   kd_ukm          String?   @db.VarChar(20)
936:   nm_ukm          String?   @db.VarChar(100)
937:   kd_peruntukan   String?   @db.VarChar(20)
938:   nm_peruntukan   String?   @db.VarChar(100)
939:   kd_komponen     String?   @db.VarChar(20)
940:   nm_komponen     String?   @db.VarChar(225)
941:   kd_rincian      String?   @db.VarChar(20)
942:   nm_rincian      String?   @db.VarChar(225)
943:   kd_sub_kegiatan String?   @db.VarChar(50)
944:   nm_sub_kegiatan String?   @db.VarChar(225)
945:   kd_spm          String?   @db.Char(5)
946:   nm_spm          String?   @db.VarChar(225)
947: 
948:   keterangan      String?   @db.Text
949:   status          String    @default("draft") // draft, diajukan, disetujui, ditolak
950:   jenis_permintaan String   @default("pengadaan") // pengadaan, non_pengadaan
951:   dibuat_oleh     String?   @db.VarChar(100)
952:   disetujui_oleh  String?   @db.VarChar(100)
953:   tgl_dibuat      DateTime  @default(now())
954:   tgl_disetujui   DateTime?
955:   updated_at      DateTime  @updatedAt
956: 
957:   rincian         RincianPermintaanBelanja[]
958:   pengadaan       Pengadaan?
959:   tagihan         Tagihan[]
960: 
961:   @@map("tbl_permintaan_belanja")
962: }
963: 
964: model RincianPermintaanBelanja {
965:   id                    Int     @id @default(autoincrement())
966:   permintaan_belanja_id Int
967:   
968:   kd_ukm          String?   @db.VarChar(20)
969:   kd_peruntukan   String?   @db.VarChar(20)
970:   kd_komponen     String?   @db.VarChar(20)
971:   kd_rincian      String?   @db.VarChar(20)
972:   kd_sub_kegiatan String?   @db.VarChar(50)
973:   kd_spm          String?   @db.Char(5)
974: 
975:   no_permintaan   String?   @db.VarChar(100)
976:   tgl_permintaan  DateTime?
977: 
978: 
979:   kd_rek6               String? @db.VarChar(50)
980:   nm_rek6               String? @db.VarChar(100)
981:   uraian                String? @db.Text
982:   volume                Float?
983:   satuan                String? @db.VarChar(50)
984:   harga                 Float?
985:   total                 Float?
986:   sumdan                String? @db.VarChar(225)
987:   nm_sumdan             String? @db.VarChar(225)
988: 
989:   permintaan_belanja PermintaanBelanja @relation(fields: [permintaan_belanja_id], references: [id], onDelete: Cascade)
990: 
991:   @@map("tbl_rincian_permintaan_belanja")
992: }
993: 
994: model Pengadaan {
995:   id                    Int       @id @default(autoincrement())
996:   permintaan_belanja_id Int?      @unique
997:   kd_upt                String    @db.VarChar(50)
998:   tahun                 String    @db.VarChar(4)
999:   no_kontrak            String    @unique @db.VarChar(100)
1000:   tgl_kontrak           DateTime
1001:   nm_vendor             String?   @db.VarChar(225)
1002:   alamat_vendor         String?   @db.Text
1003:   uraian                String?   @db.Text
1004:   
1005:   no_permintaan         String?   @db.VarChar(100)
1006:   
1007:   kd_ukm          String?   @db.VarChar(20)
1008:   nm_ukm          String?   @db.VarChar(100)
1009:   kd_peruntukan   String?   @db.VarChar(20)
1010:   nm_peruntukan   String?   @db.VarChar(100)
1011:   kd_komponen     String?   @db.VarChar(20)
1012:   nm_komponen     String?   @db.VarChar(225)
1013:   kd_rincian      String?   @db.VarChar(20)
1014:   nm_rincian      String?   @db.VarChar(225)
1015:   kd_sub_kegiatan String?   @db.VarChar(50)
1016:   nm_sub_kegiatan String?   @db.VarChar(225)
1017:   kd_spm          String?   @db.Char(5)
1018:   nm_spm          String?   @db.VarChar(225)
1019: 
1020:   nilai_kontrak         Float?
1021:   status                String    @default("proses") // proses, selesai, batal
1022:   dibuat_oleh           String?   @db.VarChar(100)
1023:   tgl_dibuat            DateTime  @default(now())
1024:   updated_at            DateTime  @updatedAt
1025: 
1026:   permintaan_belanja    PermintaanBelanja? @relation(fields: [permintaan_belanja_id], references: [id])
1027:   penerimaan            PenerimaanBarang[]
1028:   rincian               RincianPengadaan[]
1029: 
1030:   @@map("tbl_pengadaan")
1031: }
1032: 
1033: model RincianPengadaan {
1034:   id                    Int     @id @default(autoincrement())
1035:   pengadaan_id          Int
1036:   
1037:   kd_rek6               String? @db.VarChar(50)
1038:   nm_rek6               String? @db.VarChar(100)
1039:   uraian                String? @db.Text
1040:   
1041:   kd_ukm          String?   @db.VarChar(20)
1042:   nm_ukm          String?   @db.VarChar(100)
1043:   kd_peruntukan   String?   @db.VarChar(20)
1044:   nm_peruntukan   String?   @db.VarChar(100)
1045:   kd_komponen     String?   @db.VarChar(20)
1046:   nm_komponen     String?   @db.VarChar(225)
1047:   kd_rincian      String?   @db.VarChar(20)
1048:   nm_rincian      String?   @db.VarChar(225)
1049:   kd_sub_kegiatan String?   @db.VarChar(50)
1050:   nm_sub_kegiatan String?   @db.VarChar(225)
1051:   kd_spm          String?   @db.Char(5)
1052:   nm_spm          String?   @db.VarChar(225)
1053:   volume                Float?
1054:   satuan                String? @db.VarChar(50)
1055:   harga                 Float?
1056:   total                 Float?
1057:   sumdan                String? @db.VarChar(225)
1058:   nm_sumdan             String? @db.VarChar(225)
1059: 
1060:   pengadaan             Pengadaan @relation(fields: [pengadaan_id], references: [id], onDelete: Cascade)
1061: 
1062:   @@map("tbl_rincian_pengadaan")
1063: }
1064: 
1065: model PenerimaanBarang {
1066:   id              Int       @id @default(autoincrement())
1067:   pengadaan_id    Int
1068:   no_bast         String    @unique @db.VarChar(100)
1069:   tgl_bast        DateTime
1070:   keterangan      String?   @db.Text
1071:   status          String    @default("diterima") // diterima, retur
1072:   diterima_oleh   String?   @db.VarChar(100)
1073:   tgl_dibuat      DateTime  @default(now())
1074:   updated_at      DateTime  @updatedAt
1075: 
1076:   pengadaan       Pengadaan @relation(fields: [pengadaan_id], references: [id])
1077:   tagihan         Tagihan[]
1078: 
1079:   @@map("tbl_penerimaan_barang")
1080: }
1081: 
1082: model Tagihan {
1083:   id                    Int       @id @default(autoincrement())
1084:   penerimaan_barang_id  Int?
1085:   permintaan_belanja_id Int?
1086:   no_tagihan            String    @unique @db.VarChar(100)
1087:   tgl_tagihan           DateTime
1088:   nilai_tagihan         Float?
1089:   keterangan            String?   @db.Text
1090:   
1091:   kd_ukm          String?   @db.VarChar(20)
1092:   nm_ukm          String?   @db.VarChar(100)
1093:   kd_peruntukan   String?   @db.VarChar(20)
1094:   nm_peruntukan   String?   @db.VarChar(100)
1095:   kd_komponen     String?   @db.VarChar(20)
1096:   nm_komponen     String?   @db.VarChar(225)
1097:   kd_rincian      String?   @db.VarChar(20)
1098:   nm_rincian      String?   @db.VarChar(225)
1099:   kd_sub_kegiatan String?   @db.VarChar(50)
1100:   nm_sub_kegiatan String?   @db.VarChar(225)
1101:   kd_spm          String?   @db.Char(5)
1102:   nm_spm          String?   @db.VarChar(225)
1103:   
1104:   // Rincian fields pulled up to header for easier reporting (from first rincian)
1105:   kd_rek6               String? @db.VarChar(50)
1106:   nm_rek6               String? @db.VarChar(100)
1107:   sumdan                String? @db.VarChar(225)
1108:   nm_sumdan             String? @db.VarChar(225)
1109: 
1110:   status                String    @default("belum_dibayar") // belum_dibayar, proses_bayar, lunas
1111:   tgl_dibuat            DateTime  @default(now())
1112:   updated_at            DateTime  @updatedAt
1113: 
1114:   penerimaan_barang     PenerimaanBarang? @relation(fields: [penerimaan_barang_id], references: [id])
1115:   permintaan_belanja    PermintaanBelanja? @relation(fields: [permintaan_belanja_id], references: [id])
1116:   rincian               RincianTagihan[]
1117:   spp                   SPP[]
1118:   bku                   BKU[]
1119: 
1120:   @@map("tbl_tagihan")
1121: }
1122: 
1123: model RincianTagihan {
1124:   id                    Int       @id @default(autoincrement())
1125:   tagihan_id            Int
1126:   
1127:   kd_rek6               String? @db.VarChar(50)
1128:   nm_rek6               String? @db.VarChar(100)
1129:   uraian                String? @db.Text
1130:   
1131:   kd_ukm          String?   @db.VarChar(20)
1132:   nm_ukm          String?   @db.VarChar(100)
1133:   kd_peruntukan   String?   @db.VarChar(20)
1134:   nm_peruntukan   String?   @db.VarChar(100)
1135:   kd_komponen     String?   @db.VarChar(20)
1136:   nm_komponen     String?   @db.VarChar(225)
1137:   kd_rincian      String?   @db.VarChar(20)
1138:   nm_rincian      String?   @db.VarChar(225)
1139:   kd_sub_kegiatan String?   @db.VarChar(50)
1140:   nm_sub_kegiatan String?   @db.VarChar(225)
1141:   kd_spm          String?   @db.Char(5)
1142:   nm_spm          String?   @db.VarChar(225)
1143:   
1144:   volume                Float?
1145:   satuan                String? @db.VarChar(50)
1146:   harga                 Float?
1147:   total                 Float?
1148:   sumdan                String? @db.VarChar(225)
1149:   nm_sumdan             String? @db.VarChar(225)
1150: 
1151:   tagihan               Tagihan @relation(fields: [tagihan_id], references: [id], onDelete: Cascade)
1152: 
1153:   @@map("tbl_rincian_tagihan")
1154: }
1155: 
1156: """

clean1 = re.sub(r'^\d+:\s?', '', text1, flags=re.MULTILINE)
clean2 = re.sub(r'^\d+:\s?', '', text2, flags=re.MULTILINE)

with open('d:/Project-App/NextjsApp/app-blud/prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(clean1 + clean2)
