"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, ChevronDown, LogOut, Key, ShieldCheck } from "lucide-react";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  title?: string;
}

interface UserInfo {
  nama: string;
  roleLabel: string;
  role: string;
  upt?: { nm_upt: string } | null;
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: "#10B981",
  kpa: "#3B82F6",
  perencana: "#8B5CF6",
  keuangan: "#F59E0B",
  bendahara: "#F43F5E",
};

export default function Header({ setSidebarOpen, title }: HeaderProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  
  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user));
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("tahunAnggaran");
    router.push("/");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok!");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "programming-123",
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.message || "Gagal mengubah password");
      } else {
        setPasswordSuccess("Password berhasil diubah!");
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordSuccess("");
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }, 1500);
      }
    } catch (err) {
      setPasswordError("Terjadi kesalahan jaringan.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleColor = user ? ROLE_COLORS[user.role] || "#94A3B8" : "#94A3B8";

  return (
    <>
      <header className="page-header" style={{ position: "relative" }}>
      {/* Mobile Hamburger */}
      <button
        className="md:hidden"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#64748B", padding: 4, borderRadius: 6
        }}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={22} />
      </button>

      {/* Breadcrumb / Title */}
      <div style={{ flex: 1 }}>
        {title && (
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            {title}
          </h1>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Date/Time */}
        {mounted && (
          <div style={{ textAlign: "right", display: "none", gap: 0 }} className="lg:block">
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", letterSpacing: "0.02em" }}>
              {time.toLocaleTimeString("id-ID")}
            </div>
            <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
              {time.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        )}

        {/* Notification (placeholder) */}
        <button
          style={{
            background: "none", border: "1.5px solid #E2E8F0", cursor: "pointer",
            color: "#64748B", padding: "6px 8px", borderRadius: 9,
            display: "flex", alignItems: "center", transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.color = "#2563EB"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; }}
        >
          <Bell size={17} />
        </button>

        {/* User Avatar & Dropdown */}
        {user && (
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 8px", borderRadius: 12, transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "#fff", fontWeight: 700, flexShrink: 0,
                  boxShadow: `0 2px 8px ${roleColor}44`,
                }}
              >
                {(user.nama?.[0] || "U").toUpperCase()}
              </div>
              <div style={{ display: "none" }} className="lg:block">
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{user.nama}</div>
                <div style={{ fontSize: 11, color: roleColor, fontWeight: 500 }}>{user.roleLabel}</div>
              </div>
              <ChevronDown size={14} color="#94A3B8" style={{ marginLeft: 4, transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="animate-fadein"
                style={{
                  position: "absolute", top: "100%", right: 0, marginTop: 8,
                  width: 200, background: "#fff", borderRadius: 12,
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
                  zIndex: 100, overflow: "hidden", padding: 6,
                }}
              >
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #F1F5F9", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", wordBreak: "break-all" }}>{user.nama}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    {user.upt?.nm_upt || "Dinas Kesehatan"}
                  </div>
                </div>
                
                <button
                  onClick={() => { setDropdownOpen(false); setPasswordModalOpen(true); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", background: "none", border: "none",
                    borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#475569",
                    textAlign: "left", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#0F172A"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#475569"; }}
                >
                  <Key size={16} color="#3B82F6" /> Ganti Password
                </button>
                
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", background: "none", border: "none",
                    borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#F43F5E",
                    textAlign: "left", transition: "all 0.15s ease", marginTop: 2
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF1F2"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  <LogOut size={16} /> Keluar (Logout)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      </header>

      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.7)", backdropFilter: "blur(5px)" }} onClick={(e) => e.target === e.currentTarget && setPasswordModalOpen(false)}>
          <div className="modal animate-fadein" style={{ width: "100%", maxWidth: 480, padding: 0, overflow: "hidden", borderRadius: 20, background: "white", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            {/* Header Banner */}
            <div style={{ background: "linear-gradient(135deg, #1E3A8A, #3B82F6)", padding: "24px 32px", color: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={24} /> Keamanan Akun
                  </h2>
                  <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Perbarui password untuk menjaga keamanan akun Anda</p>
                </div>
                <button 
                  onClick={() => setPasswordModalOpen(false)}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                >✕</button>
              </div>
              
              {user && (
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24, background: "rgba(255,255,255,0.1)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "white", color: "#1E3A8A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    {(user.nama?.[0] || "U").toUpperCase()}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.nama}</div>
                    <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{user.roleLabel}</span>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.upt?.nm_upt || "Dinas Kesehatan"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handlePasswordSubmit} style={{ padding: "24px 32px" }}>
              <div style={{ display: "grid", gap: 18 }}>
                {passwordError && (
                  <div className="animate-fadein" style={{ padding: "12px 16px", background: "#FFF1F2", color: "#E11D48", borderRadius: 8, fontSize: 13, fontWeight: 500, borderLeft: "4px solid #E11D48" }}>
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="animate-fadein" style={{ padding: "12px 16px", background: "#ECFDF5", color: "#059669", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, borderLeft: "4px solid #10B981" }}>
                    <ShieldCheck size={18} /> {passwordSuccess}
                  </div>
                )}
                
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Password Saat Ini *</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    style={{ width: "100%", height: 42, padding: "0 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 14, outline: "none", transition: "all 0.2s" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
                
                <div style={{ height: 1, background: "#F1F5F9", margin: "4px 0" }} />
                
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Password Baru *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    style={{ width: "100%", height: 42, padding: "0 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 14, outline: "none", transition: "all 0.2s" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Konfirmasi Password Baru *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    minLength={6}
                    style={{ width: "100%", height: 42, padding: "0 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 14, outline: "none", transition: "all 0.2s" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
                <button type="button" onClick={() => setPasswordModalOpen(false)} style={{ padding: "0 20px", height: 42, borderRadius: 8, background: "#F1F5F9", color: "#475569", fontWeight: 600, border: "none", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#E2E8F0"} onMouseLeave={(e) => e.currentTarget.style.background = "#F1F5F9"}>Batal</button>
                <button type="submit" disabled={passwordLoading || !!passwordSuccess} style={{ padding: "0 20px", height: 42, borderRadius: 8, background: passwordLoading ? "#94A3B8" : "linear-gradient(135deg, #2563EB, #3B82F6)", color: "white", fontWeight: 600, border: "none", cursor: passwordLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "transform 0.1s, box-shadow 0.2s", boxShadow: passwordLoading ? "none" : "0 4px 12px rgba(37,99,235,0.3)" }} onMouseEnter={(e) => { if (!passwordLoading && !passwordSuccess) e.currentTarget.style.transform = "translateY(-1px)" }} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                  {passwordLoading ? <span className="loading-spinner" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} /> : <Key size={16} />}
                  {passwordLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}