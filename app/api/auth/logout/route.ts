import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout berhasil" });
  response.cookies.set({
    name: "token",
    value: "",
    maxAge: 0, // hapus cookie
    path: "/",
  });
  return response;
}
