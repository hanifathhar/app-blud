"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import logo from "@/public/favicon.png";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  BookOpen,
  BarChart3,
  Monitor,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  CalendarDays,
  ClipboardList,
  Receipt,
  Banknote,
  PieChart,
  FileBarChart,
  Shield,
  X,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface UserInfo {
  id: number;
  nama: string;
  username: string;
  level: number;
  role: string;
  roleLabel: string;
  kd_upt: string | null;
  upt?: { nm_upt: string; type: string } | null;
}

interface MenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles: string[];
  children?: { label: string; href: string; roles: string[] }[];
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: "#10B981",
  kpa: "#3B82F6",
  perencana: "#8B5CF6",
  keuangan: "#F59E0B",
  bendahara: "#F43F5E",
};

const menus: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={17} />,
    roles: ["superadmin", "kpa", "perencana", "keuangan", "bendahara"],
  },
  {
    label: "Perencanaan",
    href: "#",
    icon: <ClipboardList size={17} />,
    roles: ["superadmin", "kpa", "perencana"],
    children: [
      { label: "RUK Pendapatan", href: "/dashboard/perencanaan/puk-pendapatan", roles: ["superadmin", "kpa", "perencana"] },
      { label: "RUK Belanja", href: "/dashboard/perencanaan/puk", roles: ["superadmin", "kpa", "perencana"] },
      { label: "RBA Pendapatan", href: "/dashboard/perencanaan/rba-pendapatan", roles: ["superadmin", "kpa", "perencana"] },
      { label: "RBA Belanja", href: "/dashboard/perencanaan/rba", roles: ["superadmin", "kpa", "perencana"] },
      { label: "Penetapan RBA", href: "/dashboard/perencanaan/penetapan-rba", roles: ["superadmin", "kpa"] },
      { label: "Dokumen Anggaran", href: "/dashboard/perencanaan/dokumen-anggaran", roles: ["superadmin", "kpa", "perencana"] }
    ],
  },
  {
    label: "Penatausahaan",
    href: "#",
    icon: <FileText size={17} />,
    roles: ["superadmin", "kpa", "keuangan", "bendahara"],
    children: [
      { label: "SPP", href: "/dashboard/penatausahaan/spp", roles: ["superadmin", "kpa", "keuangan", "bendahara"] },
      { label: "SPM", href: "/dashboard/penatausahaan/spm", roles: ["superadmin", "kpa"] },
      { label: "SP2D", href: "/dashboard/penatausahaan/sp2d", roles: ["superadmin", "kpa", "bendahara", "keuangan"] },
      { label: "Buku Kas Umum (BKU)", href: "/dashboard/penatausahaan/bku", roles: ["superadmin", "bendahara", "keuangan"] },
    ],
  },
  {
    label: "Pelaporan",
    href: "#",
    icon: <BarChart3 size={17} />,
    roles: ["superadmin", "kpa", "keuangan", "perencana"],
    children: [
      { label: "Realisasi Anggaran", href: "/dashboard/pelaporan/realisasi", roles: ["superadmin", "kpa", "keuangan", "perencana"] },
      { label: "LPJ (Lap. Pertanggungjawaban)", href: "/dashboard/pelaporan/lpj", roles: ["superadmin", "kpa", "keuangan"] },
      { label: "Neraca", href: "/dashboard/pelaporan/neraca", roles: ["superadmin", "kpa", "keuangan"] },
    ],
  },
  {
    label: "Monitoring",
    href: "/dashboard/monitoring",
    icon: <Monitor size={17} />,
    roles: ["superadmin"],
  },
  {
    label: "Master Data",
    href: "#",
    icon: <Building2 size={17} />,
    roles: ["superadmin"],
    children: [
      { label: "Data UPT", href: "/dashboard/master/upt", roles: ["superadmin"] },
      { label: "Tahun Anggaran", href: "/dashboard/master/tahun", roles: ["superadmin"] },
      { label: "Program", href: "/dashboard/master/program", roles: ["superadmin"] },
      { label: "Kegiatan", href: "/dashboard/master/kegiatan", roles: ["superadmin"] },
      { label: "Sub Kegiatan", href: "/dashboard/master/sub-kegiatan", roles: ["superadmin"] },
      { label: "Upaya Kesehatan Masyarakat", href: "/dashboard/master/ukm", roles: ["superadmin"] },
      { label: "Peruntukan Kegiatan", href: "/dashboard/master/peruntukan-kegiatan", roles: ["superadmin"] },
      { label: "Komponen Kegiatan", href: "/dashboard/master/komponen-kegiatan", roles: ["superadmin"] },
      { label: "Sub Komponen Kegiatan", href: "/dashboard/master/sub-komponen-kegiatan", roles: ["superadmin"] },
      { label: "SPM", href: "/dashboard/master/spm", roles: ["superadmin"] },
      { label: "Sumber Dana", href: "/dashboard/master/sumber-dana", roles: ["superadmin"] },
    ],
  },
  {
    label: "Manajemen Pengguna",
    href: "/dashboard/admin/pengguna",
    icon: <Users size={17} />,
    roles: ["superadmin"],
  },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(console.error);
  }, []);

  // Auto-expand active section
  useEffect(() => {
    menus.forEach((m) => {
      if (m.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))) {
        setOpenMenus((prev) => prev.includes(m.label) ? prev : [...prev, m.label]);
      }
    });
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const navigate = (href: string) => {
    router.push(href);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const visibleMenus = user
    ? menus.filter((m) => m.roles.includes(user.role))
    : [];

  const roleColor = user ? ROLE_COLORS[user.role] || "#94A3B8" : "#94A3B8";

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        style={{ transform: sidebarOpen ? "translateX(0)" : undefined }}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo-wrap">
            <div className="sidebar-logo-box" style={{ position: "relative" }}>
              <Image src={logo} alt="Logo SI-BLUD" fill style={{ objectFit: "contain", borderRadius: "12px" }} priority />
            </div>
            <div>
              <div className="sidebar-title">SI-BLUD</div>
              <div className="sidebar-subtitle">Sistem Keuangan Terpadu</div>
            </div>
            <button
              className="ml-auto md:hidden"
              style={{ color: "#94A3B8" }}
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="sidebar-user-info">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: "#fff", fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {(user.nama?.[0] || "U").toUpperCase()}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div className="sidebar-user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.nama}
                  </div>
                  <div
                    className="sidebar-user-role"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      color: roleColor, fontWeight: 600, fontSize: 10,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: roleColor, flexShrink: 0 }} />
                    {user.roleLabel}
                  </div>
                  {user.upt && (
                    <div className="sidebar-user-upt">
                      🏥 {user.upt.nm_upt}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {visibleMenus.map((item) => {
            const isActive = item.href !== "#" && pathname === item.href;
            const hasChildren = !!item.children;
            const isOpen = openMenus.includes(item.label);
            const visibleChildren = item.children?.filter((c) =>
              user ? c.roles.includes(user.role) : false
            );

            return (
              <div key={item.label}>
                <button
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (hasChildren) toggleMenu(item.label);
                    else navigate(item.href);
                  }}
                  style={{ justifyContent: "space-between" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="sidebar-item-icon">{item.icon}</span>
                    {item.label}
                  </span>
                  {hasChildren && (
                    <span style={{ opacity: 0.5 }}>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  )}
                </button>

                {hasChildren && isOpen && visibleChildren && (
                  <div className="sidebar-submenu">
                    {visibleChildren.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                      return (
                        <button
                          key={child.href}
                          className={`sidebar-submenu-item ${childActive ? "active" : ""}`}
                          onClick={() => navigate(child.href)}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ fontSize: 10, color: "#475569", textAlign: "center", marginBottom: 8 }}>
            © 2025 Sistem BLUD Kesehatan
          </div>
        </div>
      </aside>
    </>
  );
}