import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-blud-keuangan";

export type BludRole = "superadmin" | "kpa" | "perencana" | "keuangan" | "bendahara";

// Mapping level integer ke nama role BLUD
// level 1 = superadmin (Dinas Kesehatan)
// level 2 = kpa (Kuasa Pengguna Anggaran)
// level 3 = perencana (Kasubag Perencana)
// level 4 = keuangan (Kasubag Keuangan/Pelaporan)
// level 5 = bendahara (Bendahara)
export const LEVEL_TO_ROLE: Record<number, BludRole> = {
  1: "superadmin",
  2: "kpa",
  3: "perencana",
  4: "keuangan",
  5: "bendahara",
};

export const ROLE_LABELS: Record<BludRole, string> = {
  superadmin: "Super Admin (Dinkes)",
  kpa: "KPA",
  perencana: "Kasubag Perencana",
  keuangan: "Kasubag Keuangan",
  bendahara: "Bendahara",
};

export interface UserJwtPayload extends JwtPayload {
  id: number;
  username: string;
  nama: string;
  level: number;
  role: BludRole;
  kd_upt: string | null;
  unit: string | null;
  email?: string | null;
  tahun?: string;
}

export function getUserFromRequest(
  req: Request | NextRequest
): UserJwtPayload | null {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="));

    const rawToken = tokenMatch ? tokenMatch.split("=").slice(1).join("=") : "";

    if (!rawToken) return null;

    const cleanToken = decodeURIComponent(
      rawToken.replace(/^Bearer\s+/, "").trim()
    );

    const decoded = jwt.verify(cleanToken, JWT_SECRET) as UserJwtPayload;
    return decoded;
  } catch (error) {
    console.error("JWT Error:", error);
    return null;
  }
}

export function hasRole(user: UserJwtPayload | null, roles: BludRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isSuperAdmin(user: UserJwtPayload | null): boolean {
  return user?.role === "superadmin";
}

export function isUptUser(user: UserJwtPayload | null, kdUpt: string): boolean {
  if (!user) return false;
  if (user.role === "superadmin") return true; // superadmin bisa akses semua UPT
  return user.kd_upt === kdUpt || user.unit === kdUpt;
}