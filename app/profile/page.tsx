"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import {
  UserCircle2,
  Shield,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

interface UserData {
  id: number;
  nama: string;
  username: string;
  no_tlp: string;
  level: string;
  kelompok?: {
    nama_kelompok: string;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch("/api/me");

        if (!res.ok) {
          window.location.href = "/login";
          return;
        }

        const json = await res.json();

        setUser(json.user);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);


  const handleChangePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error("Password lama wajib diisi");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    if (oldPassword === newPassword) {
      toast.error("Password baru harus berbeda");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        "/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "programming-123",
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || json.error
        );
      }

      toast.success(json.message);

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Memuat profil...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        active="profile"
      />

      <div className="flex-1 flex flex-col overflow-y-auto">

        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={async () => {
            await fetch("/api/auth/logout", {
              method: "POST",
            });

            window.location.href = "/login";
          }}
        />

        <main className="p-6 space-y-6">

          {/* Header */}

          <div className="rounded-3xl bg-gradient-to-r from-red-700 to-red-500 text-white shadow-xl p-6">

            <div className="flex items-center gap-4">

              <UserCircle2 size={40} />

              <div>

                <h1 className="text-3xl font-bold">

                  Profil Pengguna

                </h1>

                <p className="text-blue-100 mt-1">

                  Informasi akun yang sedang digunakan.

                </p>

              </div>

            </div>

          </div>

          {/* Card Profil */}

          <div className="bg-white rounded-3xl shadow-lg p-8">

            <div className="flex flex-col lg:flex-row gap-8">

              {/* Avatar */}

              <div className="flex flex-col items-center lg:w-72">

                <div className="w-32 h-32 rounded-full bg-blue-600 text-white flex items-center justify-center text-5xl font-bold shadow-lg">

                  {user.nama.charAt(0).toUpperCase()}

                </div>

                <h2 className="mt-4 text-2xl font-bold">

                  {user.nama}

                </h2>

                <span className="mt-2 px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">

                  {user.level}

                </span>

              </div>

              {/* Informasi */}
              <div className="flex-1 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/30 p-5 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100/50 rounded-xl">
                      <User className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Nama Lengkap</p>
                      <h3 className="font-bold text-gray-800 text-lg mt-0.5">{user.nama}</h3>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/30 p-5 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100/50 rounded-xl">
                      <UserCircle2 className="text-emerald-600" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Username</p>
                      <h3 className="font-bold text-gray-800 text-lg mt-0.5">{user.username}</h3>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/30 p-5 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100/50 rounded-xl">
                      <Phone className="text-amber-600" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Nomor HP</p>
                      <h3 className="font-bold text-gray-800 text-lg mt-0.5">{user.no_tlp}</h3>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/30 p-5 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-100/50 rounded-xl">
                      <Shield className="text-rose-600" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Level Akses</p>
                      <h3 className="font-bold text-gray-800 text-lg mt-0.5 capitalize">{user.level}</h3>
                    </div>
                  </div>
                </div>

                {user.kelompok && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/30 p-5 hover:bg-white hover:shadow-md transition-all duration-300 md:col-span-2">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100/50 rounded-xl">
                        <Users className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Kelompok UP2K</p>
                        <h3 className="font-bold text-gray-800 text-lg mt-0.5">{user.kelompok.nama_kelompok}</h3>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

    

          <div className="bg-white rounded-3xl shadow-lg p-8">

          <div className="flex items-center gap-3 mb-6">

            <Lock className="text-blue-600" />

            <h2 className="text-2xl font-bold">

              Ubah Password

            </h2>

          </div>

          <form
            onSubmit={handleChangePassword}
            className="space-y-6 max-w-xl"
          >

            {/* Password Lama */}

            <div>

              <Label>Password Lama</Label>

              <div className="relative mt-2">

                <Input
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e)=>
                    setOldPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={()=>
                    setShowOld(!showOld)
                  }
                  className="absolute right-3 top-3"
                >
                  {showOld
                    ? <EyeOff size={18}/>
                    : <Eye size={18}/>
                  }
                </button>

              </div>

            </div>

            {/* Password Baru */}

            <div>

              <Label>Password Baru</Label>

              <div className="relative mt-2">

                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e)=>
                    setNewPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={()=>
                    setShowNew(!showNew)
                  }
                  className="absolute right-3 top-3"
                >
                  {showNew
                    ? <EyeOff size={18}/>
                    : <Eye size={18}/>
                  }
                </button>

              </div>

            </div>

            {/* Konfirmasi */}

            <div>

              <Label>Konfirmasi Password</Label>

              <div className="relative mt-2">

                <Input
                  type={
                    showConfirm
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e)=>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  onClick={()=>
                    setShowConfirm(
                      !showConfirm
                    )
                  }
                  className="absolute right-3 top-3"
                >
                  {showConfirm
                    ? <EyeOff size={18}/>
                    : <Eye size={18}/>
                  }
                </button>

              </div>

            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <KeyRound className="h-4 w-4" />

              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              )}

              {saving
                ? "Menyimpan..."
                : "Simpan Password"}

            </Button>

          </form>

        </div>

        </main>

      </div>

    </div>
  );
}