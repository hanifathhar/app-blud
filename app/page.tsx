"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/favicon.png";
import { Eye, EyeOff, User, Lock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pasword, setPasword] = useState("");
  const [showPasword, setShowPasword] = useState(false);
  const [tahunList, setTahunList] = useState<{ id: number; tahun: number; status: string }[]>([]);
  const [tahunId, setTahunId] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [notif, setNotif] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);

    // Fetch tahun anggaran
    fetch("/api/tahun-anggaran")
      .then((r) => r.json())
      .then((d) => {
        setTahunList(d.data || []);
        const currentYear = new Date().getFullYear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const targetTahun = (d.data || []).find((t: any) => t.tahun === currentYear) || (d.data || []).find((t: any) => t.status === "aktif");
        if (targetTahun) setTahunId(String(targetTahun.id));
      });

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "programming-123" },
        body: JSON.stringify({ username, pasword }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setNotif({ type: "error", message: data.error || "Login gagal, periksa kembali username atau password." });
      } else {
        // Save selected tahunAnggaran in localStorage
        if (tahunId) {
          localStorage.setItem("tahunAnggaran", tahunId);
          const selectedTahun = tahunList.find((t) => String(t.id) === tahunId);
          if (selectedTahun) {
            localStorage.setItem("tahunName", String(selectedTahun.tahun));
          }
        }
        setNotif({ type: "success", message: "Login berhasil! Mengarahkan ke dashboard..." });
        setTimeout(() => router.push("/dashboard"), 1200);
      }
    } catch {
      setNotif({ type: "error", message: "Gagal terhubung ke server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)), url('/images/bg.png') no-repeat center center / cover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background Overlay */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>



      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, padding: "0 20px" }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            borderRadius: 24,
            padding: "36px 32px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 90, height: 90,
                margin: "0 auto 16px",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}
            >
              <Image src={logo} alt="Logo SI-BLUD" fill style={{ objectFit: "contain" }} priority />
            </div>
          </div>

          {/* Notifikasi Inline */}
          <AnimatePresence>
            {notif && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px", borderRadius: 12, fontSize: 13.5, fontWeight: 500,
                    color: notif.type === "success" ? "#065F46" : "#991B1B",
                    background: notif.type === "success" ? "#D1FAE5" : "#FEE2E2",
                    border: `1px solid ${notif.type === "success" ? "#A7F3D0" : "#FECACA"}`,
                  }}
                >
                  {notif.type === "success" ? <CheckCircle size={16} style={{ flexShrink: 0 }} /> : <XCircle size={16} style={{ flexShrink: 0 }} />}
                  <span style={{ flex: 1, lineHeight: 1.4 }}>{notif.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Tahun Anggaran
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                  <Calendar size={17} />
                </div>
                <select
                  value={tahunId}
                  onChange={(e) => setTahunId(e.target.value)}
                  required
                  style={{
                    width: "100%", height: 46, padding: "0 12px 0 40px",
                    border: "1.5px solid #E2E8F0", borderRadius: 11,
                    fontSize: 14, fontFamily: "'Inter', sans-serif", color: "#0F172A",
                    background: "#F8FAFC", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    appearance: "none", cursor: "pointer"
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#F8FAFC"; }}
                >
                  <option value="">-- Pilih Tahun --</option>
                  {tahunList.map((t) => (
                    <option key={t.id} value={t.id}>{t.tahun} {t.status === 'aktif' ? '(Aktif)' : ''}</option>
                  ))}
                </select>
                <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94A3B8" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                  <User size={17} />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: "100%", height: 46, padding: "0 12px 0 40px",
                    border: "1.5px solid #E2E8F0", borderRadius: 11,
                    fontSize: 14, fontFamily: "'Inter', sans-serif", color: "#0F172A",
                    background: "#F8FAFC", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#F8FAFC"; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                  <Lock size={17} />
                </div>
                <input
                  id="password"
                  type={showPasword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={pasword}
                  onChange={(e) => setPasword(e.target.value)}
                  required
                  style={{
                    width: "100%", height: 46, padding: "0 44px 0 40px",
                    border: "1.5px solid #E2E8F0", borderRadius: 11,
                    fontSize: 14, fontFamily: "'Inter', sans-serif", color: "#0F172A",
                    background: "#F8FAFC", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#F8FAFC"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasword(!showPasword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4,
                  }}
                >
                  {showPasword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 46, marginTop: 4,
                background: loading ? "#94A3B8" : "linear-gradient(135deg, #2563EB, #3B82F6)",
                color: "#fff", border: "none", borderRadius: 11,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
                boxShadow: loading ? "none" : "0 4px 16px rgba(37,99,235,0.4)",
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <><span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Memverifikasi...</>
              ) : "Masuk ke Sistem"}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>
              © 2025 SI-BLUD Layanan Kesehatan<br />
              Dinas Kesehatan Kab. Tapanuli Selatan
            </p>
          </div>
        </div>

        {/* Floating clock */}
        {mounted && (
          <div style={{
            textAlign: "center", marginTop: 16,
            background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)",
            borderRadius: 10, padding: "8px 16px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "0.1em" }}>
              {time.toLocaleTimeString("id-ID")}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
              {time.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        )}
      </motion.div>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
