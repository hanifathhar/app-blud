import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

    // Buat user admin default
    const hashedPassword = await bcrypt.hash("admin123", 10);

    try {
        await prisma.user.create({
            data: {
                nip: "198907122025211051",
                name: "Administrator",
                email: "admin@rtlh.com",
                password: hashedPassword,
                jabatan: "Administrator",
                role: "ADMIN",
            },
        });
        console.log("✅ User admin berhasil dibuat (NIP: admin, Password: admin123)");
    } catch (error) {
        console.log("ℹ️ User admin sudah ada atau error:", error.message);
    }

    await prisma.kecamatan.createMany({
        data: [
            { kecamatanId: 1, namakecamatan: "Aek Bilah" },
            { kecamatanId: 2, namakecamatan: "Angkola Barat" },
            { kecamatanId: 3, namakecamatan: "Angkola Muara Tais" },
            { kecamatanId: 4, namakecamatan: "Angkola Sagkunur" },
            { kecamatanId: 5, namakecamatan: "Angkola Selatan" },
            { kecamatanId: 6, namakecamatan: "Angkola Timur" },
            { kecamatanId: 7, namakecamatan: "Arse" },
            { kecamatanId: 8, namakecamatan: "Batang Angkola" },
            { kecamatanId: 9, namakecamatan: "Batang Toru" },
            { kecamatanId: 10, namakecamatan: "Marancar" },
            { kecamatanId: 11, namakecamatan: "Muara Batang Toru" },
            { kecamatanId: 12, namakecamatan: "Saipar Dolok Hole" },
            { kecamatanId: 13, namakecamatan: "Sayur Matinggi" },
            { kecamatanId: 14, namakecamatan: "Sipirok" },
            { kecamatanId: 15, namakecamatan: "Tano Tombangan Angkola" },
        ],
    });



    await prisma.desa.createMany({
        data: [
            {
                desaId: 53,
                namadesa: "Aek Badak Jae",
                kecamatanId: 1
            },
            {
                desaId: 54,
                namadesa: "Aek Badak Julu",
                kecamatanId: 1
            },
            {
                desaId: 55,
                namadesa: "Aek Libung",
                kecamatanId: 1
            },
            {
                desaId: 56,
                namadesa: "Aek Nabara",
                kecamatanId: 1
            },
            {
                desaId: 57,
                namadesa: "Aek Sabaon",
                kecamatanId: 1
            },
            {
                desaId: 58,
                namadesa: "Aek Siansimun",
                kecamatanId: 1
            },
            {
                desaId: 59,
                namadesa: "Aek Sangkilon",
                kecamatanId: 1
            },
            {
                desaId: 60,
                namadesa: "Aek Suhat",
                kecamatanId: 1
            },
            {
                desaId: 61,
                namadesa: "Pardomuan",
                kecamatanId: 1
            },
            {
                desaId: 62,
                namadesa: "Situmba",
                kecamatanId: 1
            },
            {
                desaId: 63,
                namadesa: "Siondop",
                kecamatanId: 1
            },
            {
                desaId: 64,
                namadesa: "Aek Haruaya",
                kecamatanId: 1
            },
            {
                desaId: 65,
                namadesa: "Siuhom",
                kecamatanId: 2
            },
            {
                desaId: 66,
                namadesa: "Sisundung",
                kecamatanId: 2
            },
            {
                desaId: 67,
                namadesa: "Parsalakan",
                kecamatanId: 2
            },
            {
                desaId: 68,
                namadesa: "Sialogo",
                kecamatanId: 2
            },
            {
                desaId: 69,
                namadesa: "Lembah Lubuk Raya",
                kecamatanId: 2
            },
            {
                desaId: 70,
                namadesa: "Sitara Toit",
                kecamatanId: 2
            },
            {
                desaId: 71,
                namadesa: "Lobu Layan Sigordang",
                kecamatanId: 2
            },
            {
                desaId: 72,
                namadesa: "Aek Nabara",
                kecamatanId: 2
            },
            {
                desaId: 73,
                namadesa: "Sibangkua",
                kecamatanId: 2
            },
            {
                desaId: 74,
                namadesa: "Sigumuru",
                kecamatanId: 2
            },
            {
                desaId: 75,
                namadesa: "Sitinjak",
                kecamatanId: 2
            },
            {
                desaId: 76,
                namadesa: "Simatorkis Sisoma",
                kecamatanId: 2
            },
            {
                desaId: 77,
                namadesa: "Panobasan",
                kecamatanId: 2
            },
            {
                desaId: 78,
                namadesa: "Panobasan Lombang",
                kecamatanId: 2
            },
            {
                desaId: 79,
                namadesa: "Bintuju",
                kecamatanId: 3
            },
            {
                desaId: 80,
                namadesa: "Huta Tonga",
                kecamatanId: 3
            },
            {
                desaId: 81,
                namadesa: "Basilam Baru",
                kecamatanId: 3
            },
            {
                desaId: 82,
                namadesa: "Huta Holbung",
                kecamatanId: 3
            },
            {
                desaId: 83,
                namadesa: "Janji Mauli MT",
                kecamatanId: 3
            },
            {
                desaId: 84,
                namadesa: "Muara Purba Nauli",
                kecamatanId: 3
            },
            {
                desaId: 85,
                namadesa: "Muara Tais I",
                kecamatanId: 3
            },
            {
                desaId: 86,
                namadesa: "Muara Tais II",
                kecamatanId: 3
            },
            {
                desaId: 87,
                namadesa: "Muara Tais III",
                kecamatanId: 3
            },
            {
                desaId: 88,
                namadesa: "Pangaribuan",
                kecamatanId: 3
            },
            {
                desaId: 89,
                namadesa: "Pargumbangan",
                kecamatanId: 3
            },
            {
                desaId: 90,
                namadesa: "Pasir Matogu",
                kecamatanId: 3
            },
            {
                desaId: 91,
                namadesa: "Sipangko",
                kecamatanId: 3
            },
            {
                desaId: 92,
                namadesa: "Sori Manaon",
                kecamatanId: 3
            },
            {
                desaId: 93,
                namadesa: "Tatengger",
                kecamatanId: 3
            },
            {
                desaId: 94,
                namadesa: "Aek Pardomuan",
                kecamatanId: 4
            },
            {
                desaId: 95,
                namadesa: "Bandar Tarutung",
                kecamatanId: 4
            },
            {
                desaId: 96,
                namadesa: "Batu Godang",
                kecamatanId: 4
            },
            {
                desaId: 97,
                namadesa: "Malombu",
                kecamatanId: 4
            },
            {
                desaId: 98,
                namadesa: "Perkebunan",
                kecamatanId: 4
            },
            {
                desaId: 99,
                namadesa: "Simataniari",
                kecamatanId: 4
            },
            {
                desaId: 100,
                namadesa: "Simatohir",
                kecamatanId: 4
            },
            {
                desaId: 101,
                namadesa: "Tindoan Laut",
                kecamatanId: 4
            },
            {
                desaId: 102,
                namadesa: "Napa",
                kecamatanId: 5
            },
            {
                desaId: 103,
                namadesa: "Simarpinggan",
                kecamatanId: 5
            },
            {
                desaId: 104,
                namadesa: "Tapian Nauli",
                kecamatanId: 5
            },
            {
                desaId: 105,
                namadesa: "Pardomuan",
                kecamatanId: 5
            },
            {
                desaId: 106,
                namadesa: "Aek Natas",
                kecamatanId: 5
            },
            {
                desaId: 107,
                namadesa: "Dolok Godang",
                kecamatanId: 5
            },
            {
                desaId: 108,
                namadesa: "Gunung Baringin",
                kecamatanId: 5
            },
            {
                desaId: 109,
                namadesa: "Perk. Marpinggan",
                kecamatanId: 5
            },
            {
                desaId: 110,
                namadesa: "Sihuik Huik",
                kecamatanId: 5
            },
            {
                desaId: 111,
                namadesa: "Sinyior",
                kecamatanId: 5
            },
            {
                desaId: 112,
                namadesa: "Pintu Padang",
                kecamatanId: 5
            },
            {
                desaId: 113,
                namadesa: "Sibongbong",
                kecamatanId: 5
            },
            {
                desaId: 114,
                namadesa: "Situmbaga",
                kecamatanId: 5
            },
            {
                desaId: 115,
                namadesa: "Panompuan Jae",
                kecamatanId: 6
            },
            {
                desaId: 116,
                namadesa: "Pargarutan Tonga",
                kecamatanId: 6
            },
            {
                desaId: 117,
                namadesa: "Huraba",
                kecamatanId: 6
            },
            {
                desaId: 118,
                namadesa: "Huta Ginjang",
                kecamatanId: 6
            },
            {
                desaId: 119,
                namadesa: "Lantosan Rogas",
                kecamatanId: 6
            },
            {
                desaId: 120,
                namadesa: "Marisi",
                kecamatanId: 6
            },
            {
                desaId: 121,
                namadesa: "Pargarutan Jae",
                kecamatanId: 6
            },
            {
                desaId: 122,
                namadesa: "Parg arutan Dolok",
                kecamatanId: 6
            },
            {
                desaId: 123,
                namadesa: "Pal XI",
                kecamatanId: 6
            },
            {
                desaId: 124,
                namadesa: "Sijungkang",
                kecamatanId: 6
            },
            {
                desaId: 125,
                namadesa: "Panompuan",
                kecamatanId: 6
            },
            {
                desaId: 126,
                namadesa: "Pargarutan Julu",
                kecamatanId: 6
            },
            {
                desaId: 127,
                namadesa: "Arse Nauli",
                kecamatanId: 7
            },
            {
                desaId: 128,
                namadesa: "Aek Haminjon",
                kecamatanId: 7
            },
            {
                desaId: 129,
                namadesa: "Dalihan Natolu",
                kecamatanId: 7
            },
            {
                desaId: 130,
                namadesa: "Nanggar Jati",
                kecamatanId: 7
            },
            {
                desaId: 131,
                namadesa: "Nanggar Jati Huta Padang",
                kecamatanId: 7
            },
            {
                desaId: 132,
                namadesa: "Natambang Roncitan",
                kecamatanId: 7
            },
            {
                desaId: 133,
                namadesa: "Lancat",
                kecamatanId: 7
            },
            {
                desaId: 134,
                namadesa: "Pardomuan",
                kecamatanId: 7
            },
            {
                desaId: 135,
                namadesa: "Pinagar",
                kecamatanId: 7
            },
            {
                desaId: 136,
                namadesa: "Sipogu",
                kecamatanId: 7
            },
            {
                desaId: 137,
                namadesa: "Bangun Purba",
                kecamatanId: 8
            },
            {
                desaId: 138,
                namadesa: "Pintu Padang I",
                kecamatanId: 8
            },
            {
                desaId: 139,
                namadesa: "Pintu Padang II",
                kecamatanId: 8
            },
            {
                desaId: 140,
                namadesa: "Sigalangan",
                kecamatanId: 8
            },
            {
                desaId: 141,
                namadesa: "Aek Gunung",
                kecamatanId: 8
            },
            {
                desaId: 142,
                namadesa: "Aek Nauli",
                kecamatanId: 8
            },
            {
                desaId: 143,
                namadesa: "Bargot Topong",
                kecamatanId: 8
            },
            {
                desaId: 144,
                namadesa: "Benteng Huraba",
                kecamatanId: 8
            },
            {
                desaId: 145,
                namadesa: "Hurase",
                kecamatanId: 8
            },
            {
                desaId: 146,
                namadesa: "Huta Padang",
                kecamatanId: 8
            },
            {
                desaId: 147,
                namadesa: "Janji Manaon",
                kecamatanId: 8
            },
            {
                desaId: 148,
                namadesa: "Padang Kahombu",
                kecamatanId: 8
            },
            {
                desaId: 149,
                namadesa: "Pasar Lama",
                kecamatanId: 8
            },
            {
                desaId: 150,
                namadesa: "Sibulele Muara",
                kecamatanId: 8
            },
            {
                desaId: 151,
                namadesa: "Sidadi I",
                kecamatanId: 8
            },
            {
                desaId: 152,
                namadesa: "Sidadi II",
                kecamatanId: 8
            },
            {
                desaId: 153,
                namadesa: "Sigulang Losung",
                kecamatanId: 8
            },
            {
                desaId: 154,
                namadesa: "Sitampa",
                kecamatanId: 8
            },
            {
                desaId: 155,
                namadesa: "Sorik",
                kecamatanId: 8
            },
            {
                desaId: 156,
                namadesa: "Sorimadingin Pintu Padang",
                kecamatanId: 8
            },
            {
                desaId: 157,
                namadesa: "Tahalak Ujung Gading",
                kecamatanId: 8
            },
            {
                desaId: 158,
                namadesa: "Hapesong Lama",
                kecamatanId: 9
            },
            {
                desaId: 159,
                namadesa: "Perk Hapesong",
                kecamatanId: 9
            },
            {
                desaId: 160,
                namadesa: "Padang Lancat",
                kecamatanId: 9
            },
            {
                desaId: 161,
                namadesa: "Sianggunan",
                kecamatanId: 9
            },
            {
                desaId: 162,
                namadesa: "Huta Baru",
                kecamatanId: 9
            },
            {
                desaId: 163,
                namadesa: "Hapesong Baru",
                kecamatanId: 9
            },
            {
                desaId: 164,
                namadesa: "Perkebunan Sigala-Gala",
                kecamatanId: 9
            },
            {
                desaId: 165,
                namadesa: "Perk Batang Toru",
                kecamatanId: 9
            },
            {
                desaId: 166,
                namadesa: "Telo",
                kecamatanId: 9
            },
            {
                desaId: 167,
                namadesa: "Wek III Batang Toru",
                kecamatanId: 9
            },
            {
                desaId: 168,
                namadesa: "Wek II Batang Toru",
                kecamatanId: 9
            },
            {
                desaId: 169,
                namadesa: "Wek I Batang Toru",
                kecamatanId: 9
            },
            {
                desaId: 170,
                namadesa: "Wek IV Batang Toru",
                kecamatanId: 9
            },
            {
                desaId: 171,
                namadesa: "Napa",
                kecamatanId: 9
            },
            {
                desaId: 172,
                namadesa: "Aek Pining",
                kecamatanId: 9
            },
            {
                desaId: 173,
                namadesa: "Sumuran",
                kecamatanId: 9
            },
            {
                desaId: 174,
                namadesa: "Batu Hula",
                kecamatanId: 9
            },
            {
                desaId: 175,
                namadesa: "Huta Godang",
                kecamatanId: 9
            },
            {
                desaId: 176,
                namadesa: "Garoga",
                kecamatanId: 9
            },
            {
                desaId: 177,
                namadesa: "Batu Horing",
                kecamatanId: 9
            },
            {
                desaId: 178,
                namadesa: "Aek Ngadol Nauli",
                kecamatanId: 9
            },
            {
                desaId: 179,
                namadesa: "Sisipa",
                kecamatanId: 9
            },
            {
                desaId: 180,
                namadesa: "Aek Nabara",
                kecamatanId: 10
            },
            {
                desaId: 181,
                namadesa: "Aek Sabaon",
                kecamatanId: 10
            },
            {
                desaId: 182,
                namadesa: "Gapuk Tua",
                kecamatanId: 10
            },
            {
                desaId: 183,
                namadesa: "Haunatas",
                kecamatanId: 10
            },
            {
                desaId: 184,
                namadesa: "Huraba",
                kecamatanId: 10
            },
            {
                desaId: 185,
                namadesa: "Marancar Godang",
                kecamatanId: 10
            },
            {
                desaId: 186,
                namadesa: "Marancar Julu",
                kecamatanId: 10
            },
            {
                desaId: 187,
                namadesa: "Mombang Boru",
                kecamatanId: 10
            },
            {
                desaId: 188,
                namadesa: "Simaninggir",
                kecamatanId: 10
            },
            {
                desaId: 189,
                namadesa: "Sugi",
                kecamatanId: 10
            },
            {
                desaId: 190,
                namadesa: "Tanjung Dolok",
                kecamatanId: 10
            },
            {
                desaId: 191,
                namadesa: "Pasar Sempurna",
                kecamatanId: 10
            },
            {
                desaId: 192,
                namadesa: "Bandar Hapinis",
                kecamatanId: 11
            },
            {
                desaId: 193,
                namadesa: "Huta Raja",
                kecamatanId: 11
            },
            {
                desaId: 194,
                namadesa: "Muara Ampolu",
                kecamatanId: 11
            },
            {
                desaId: 195,
                namadesa: "Muara Manompas",
                kecamatanId: 11
            },
            {
                desaId: 196,
                namadesa: "Muara Upu",
                kecamatanId: 11
            },
            {
                desaId: 197,
                namadesa: "Pardamean",
                kecamatanId: 11
            },
            {
                desaId: 198,
                namadesa: "Tarapung Raya",
                kecamatanId: 11
            },
            {
                desaId: 199,
                namadesa: "Sumuran",
                kecamatanId: 11
            },
            {
                desaId: 200,
                namadesa: "Aek Pining",
                kecamatanId: 11
            },
            {
                desaId: 201,
                namadesa: "Aek Simotung",
                kecamatanId: 12
            },
            {
                desaId: 202,
                namadesa: "Sipagimbar",
                kecamatanId: 12
            },
            {
                desaId: 203,
                namadesa: "Batang Parsuluman",
                kecamatanId: 12
            },
            {
                desaId: 204,
                namadesa: "Damparan Haunatas",
                kecamatanId: 12
            },
            {
                desaId: 205,
                namadesa: "Padang Mandailing Garugur",
                kecamatanId: 12
            },
            {
                desaId: 206,
                namadesa: "Parau Sorat Sitabo-Tabo",
                kecamatanId: 12
            },
            {
                desaId: 207,
                namadesa: "Pintu Padang Mandalasena",
                kecamatanId: 12
            },
            {
                desaId: 208,
                namadesa: "Saut Banua Simanosor",
                kecamatanId: 12
            },
            {
                desaId: 209,
                namadesa: "Sidapdap Simanosor",
                kecamatanId: 12
            },
            {
                desaId: 210,
                namadesa: "Silangkitang Tambiski",
                kecamatanId: 12
            },
            {
                desaId: 211,
                namadesa: "Simangambat",
                kecamatanId: 12
            },
            {
                desaId: 212,
                namadesa: "Somba Debata Purba",
                kecamatanId: 12
            },
            {
                desaId: 213,
                namadesa: "Sunge Sigiring-Giring",
                kecamatanId: 12
            },
            {
                desaId: 214,
                namadesa: "Ulu Mamis Situnggaling",
                kecamatanId: 12
            },
            {
                desaId: 215,
                namadesa: "Sayur Matinggi",
                kecamatanId: 13
            },
            {
                desaId: 216,
                namadesa: "Aek Badak Jae",
                kecamatanId: 13
            },
            {
                desaId: 217,
                namadesa: "Aek Badak Julu",
                kecamatanId: 13
            },
            {
                desaId: 218,
                namadesa: "Aek Libung",
                kecamatanId: 13
            },
            {
                desaId: 219,
                namadesa: "Bange",
                kecamatanId: 13
            },
            {
                desaId: 220,
                namadesa: "Bulu Gading",
                kecamatanId: 13
            },
            {
                desaId: 221,
                namadesa: "Huta Pardomuan",
                kecamatanId: 13
            },
            {
                desaId: 222,
                namadesa: "Janji Mauli Baringin",
                kecamatanId: 13
            },
            {
                desaId: 223,
                namadesa: "Lumban Huayan",
                kecamatanId: 13
            },
            {
                desaId: 224,
                namadesa: "Mondang",
                kecamatanId: 13
            },
            {
                desaId: 225,
                namadesa: "Sialang",
                kecamatanId: 13
            },
            {
                desaId: 226,
                namadesa: "Silaiya",
                kecamatanId: 13
            },
            {
                desaId: 227,
                namadesa: "Silaiya Tanjung Leuk",
                kecamatanId: 13
            },
            {
                desaId: 228,
                namadesa: "Sipange Godang",
                kecamatanId: 13
            },
            {
                desaId: 229,
                namadesa: "Sipange Julu",
                kecamatanId: 13
            },
            {
                desaId: 230,
                namadesa: "Sipange Leuk",
                kecamatanId: 13
            },
            {
                desaId: 231,
                namadesa: "Somanggal Parmonangan",
                kecamatanId: 13
            },
            {
                desaId: 232,
                namadesa: "Tolang Jae",
                kecamatanId: 13
            },
            {
                desaId: 233,
                namadesa: "Tolang Julu",
                kecamatanId: 13
            },
            {
                desaId: 234,
                namadesa: "Tolang",
                kecamatanId: 14
            },
            {
                desaId: 235,
                namadesa: "Janji Mauli",
                kecamatanId: 14
            },
            {
                desaId: 236,
                namadesa: "Baringin",
                kecamatanId: 14
            },
            {
                desaId: 237,
                namadesa: "Parau Sorat",
                kecamatanId: 14
            },
            {
                desaId: 238,
                namadesa: "Siala Gundi",
                kecamatanId: 14
            },
            {
                desaId: 239,
                namadesa: "Barnang Koling",
                kecamatanId: 14
            },
            {
                desaId: 240,
                namadesa: "Pargarutan",
                kecamatanId: 14
            },
            {
                desaId: 241,
                namadesa: "Panaungan",
                kecamatanId: 14
            },
            {
                desaId: 242,
                namadesa: "Pangaribuan",
                kecamatanId: 14
            },
            {
                desaId: 243,
                namadesa: "Padang Bujur",
                kecamatanId: 14
            },
            {
                desaId: 244,
                namadesa: "Simaninggir",
                kecamatanId: 14
            },
            {
                desaId: 245,
                namadesa: "Paran Padang",
                kecamatanId: 14
            },
            {
                desaId: 246,
                namadesa: "Pasar Sipirok",
                kecamatanId: 14
            },
            {
                desaId: 247,
                namadesa: "Pangurabaan",
                kecamatanId: 14
            },
            {
                desaId: 248,
                namadesa: "Bagas Lombang",
                kecamatanId: 14
            },
            {
                desaId: 249,
                namadesa: "Paran Julu",
                kecamatanId: 14
            },
            {
                desaId: 250,
                namadesa: "Bulu Mario",
                kecamatanId: 14
            },
            {
                desaId: 251,
                namadesa: "Batu Satail",
                kecamatanId: 14
            },
            {
                desaId: 252,
                namadesa: "Ramba Sihasur",
                kecamatanId: 14
            },
            {
                desaId: 253,
                namadesa: "Sibadoar",
                kecamatanId: 14
            },
            {
                desaId: 254,
                namadesa: "Hasang Marsada",
                kecamatanId: 14
            },
            {
                desaId: 255,
                namadesa: "Bunga Bondar",
                kecamatanId: 14
            },
            {
                desaId: 256,
                namadesa: "Sampean",
                kecamatanId: 14
            },
            {
                desaId: 257,
                namadesa: "Sialaman",
                kecamatanId: 14
            },
            {
                desaId: 258,
                namadesa: "Kilang Papan",
                kecamatanId: 14
            },
            {
                desaId: 259,
                namadesa: "Saba Batang Miha",
                kecamatanId: 14
            },
            {
                desaId: 260,
                namadesa: "Situmba",
                kecamatanId: 14
            },
            {
                desaId: 261,
                namadesa: "Situmba Julu",
                kecamatanId: 14
            },
            {
                desaId: 262,
                namadesa: "Batang Tura Julu",
                kecamatanId: 14
            },
            {
                desaId: 263,
                namadesa: "Batang Tura",
                kecamatanId: 14
            },
            {
                desaId: 264,
                namadesa: "Paran Dolok Mardomu",
                kecamatanId: 14
            },
            {
                desaId: 265,
                namadesa: "Sarogodung",
                kecamatanId: 14
            },
            {
                desaId: 266,
                namadesa: "Dolok Sordang",
                kecamatanId: 14
            },
            {
                desaId: 267,
                namadesa: "Dolok Sordang Julu",
                kecamatanId: 14
            },
            {
                desaId: 268,
                namadesa: "Huta Suhut",
                kecamatanId: 14
            },
            {
                desaId: 269,
                namadesa: "Sipirok Godang",
                kecamatanId: 14
            },
            {
                desaId: 270,
                namadesa: "Aek Batang Paya",
                kecamatanId: 14
            },
            {
                desaId: 271,
                namadesa: "Marsada",
                kecamatanId: 14
            },
            {
                desaId: 272,
                namadesa: "Luat Lombang",
                kecamatanId: 14
            },
            {
                desaId: 273,
                namadesa: "Pahae Aek Sagala",
                kecamatanId: 14
            },
            {
                desaId: 274,
                namadesa: "Simaninggir",
                kecamatanId: 15
            },
            {
                desaId: 275,
                namadesa: "kota Tua",
                kecamatanId: 15
            },
            {
                desaId: 276,
                namadesa: "Harean",
                kecamatanId: 15
            },
            {
                desaId: 277,
                namadesa: "Lumban Ratus",
                kecamatanId: 15
            },
            {
                desaId: 278,
                namadesa: "Sisoma",
                kecamatanId: 15
            },
            {
                desaId: 279,
                namadesa: "Ingul Jae",
                kecamatanId: 15
            },
            {
                desaId: 280,
                namadesa: "Lumban Jabi-Jabi",
                kecamatanId: 15
            },
            {
                desaId: 281,
                namadesa: "Purbatua",
                kecamatanId: 15
            },
            {
                desaId: 282,
                namadesa: "Hutaraja",
                kecamatanId: 15
            },
            {
                desaId: 283,
                namadesa: "Panabari Huta Tonga",
                kecamatanId: 15
            },
            {
                desaId: 284,
                namadesa: "Situmbe",
                kecamatanId: 15
            },
            {
                desaId: 285,
                namadesa: "Batu Horpak",
                kecamatanId: 15
            },
            {
                desaId: 286,
                namadesa: "Aek Kahombu",
                kecamatanId: 15
            },
            {
                desaId: 287,
                namadesa: "Tanjung Medan",
                kecamatanId: 15
            },
            {
                desaId: 288,
                namadesa: "Aek Parupuk",
                kecamatanId: 15
            },
            {
                desaId: 289,
                namadesa: "Panindoan",
                kecamatanId: 15
            },
            {
                desaId: 290,
                namadesa: "Aek Uncim",
                kecamatanId: 15
            }
        ],
    });

}



main()
    .then(() => {
        console.log("✅ Seeding selesai!");
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
