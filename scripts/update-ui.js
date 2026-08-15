const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/dashboard/admin/pengguna/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add states
content = content.replace(
  'const [showForm, setShowForm] = useState(false);',
  'const [showForm, setShowForm] = useState(false);\n  const [showUptDialog, setShowUptDialog] = useState(false);\n  const [uptSearch, setUptSearch] = useState("");'
);

// 2. Change header button
content = content.replace(
  '<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Pengguna</button>',
  '{!showForm ? (\n          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Pengguna</button>\n        ) : (\n          <button className="btn btn-outline" onClick={() => setShowForm(false)}><ChevronLeft size={16} /> Kembali</button>\n        )}'
);

// 3. Wrap Summary & Filters in !showForm
content = content.replace(
  '{/* Summary per level */}',
  '{!showForm && (\n        <>\n      {/* Summary per level */}'
);

content = content.replace(
  '        </select>\n      </div>\n\n      {/* Form Modal */}',
  '        </select>\n      </div>\n      </>\n      )}\n\n      {/* Form Modal */}'
);

// 4. Change Form Modal to Card and update UPT select
let formCard = `      {/* Form Card */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {editing ? \`✏️ Edit — \${editing.nama}\` : "➕ Tambah Pengguna Baru"}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body" style={{ display: "grid", gap: 16, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Nama Lengkap *</label>
                  <input className="form-input" required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama pengguna" />
                </div>
                <div>
                  <label className="form-label">Username *</label>
                  <input className="form-input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" disabled={!!editing} />
                </div>
              </div>
              <div>
                <label className="form-label">{editing ? "Password Baru (kosongkan jika tidak berubah)" : "Password *"}</label>
                <input
                  className="form-input"
                  type="password"
                  required={!editing}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? "Kosongkan jika tidak berubah" : "Minimal 6 karakter"}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Level / Role *</label>
                  <select className="form-select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    {Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Unit / UPT</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input 
                      className="form-input" 
                      readOnly 
                      value={form.unit === "DINKES" ? "Dinas Kesehatan" : (upts.find(u => u.kd_upt === form.unit)?.nm_upt || "Semua UPT / Belum Dipilih")} 
                      onClick={() => setShowUptDialog(true)}
                      style={{ cursor: "pointer", flex: 1 }}
                    />
                    <button type="button" className="btn btn-outline" onClick={() => setShowUptDialog(true)}>Pilih</button>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@dinkes.go.id" />
                </div>
                <div>
                  <label className="form-label">No. Telepon</label>
                  <input className="form-input" value={form.no_telp} onChange={(e) => setForm({ ...form, no_telp: e.target.value })} placeholder="08xx" />
                </div>
              </div>
              {editing && (
                <div>
                  <label className="form-label">Status Akun</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              )}
            </div>
            <div className="card-footer" style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="loading-spinner" /> : <Shield size={14} />}
                {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Pengguna"}
              </button>
            </div>
          </form>
        </div>
      )}`;

// We need to extract the existing Form Modal string and replace it.
const formModalStart = content.indexOf('{/* Form Modal */}');
const tabelStart = content.indexOf('{/* Tabel */}');
if (formModalStart !== -1 && tabelStart !== -1) {
  content = content.substring(0, formModalStart) + formCard + '\n\n      ' + content.substring(tabelStart);
}

// 5. Wrap Table and Pagination in !showForm
content = content.replace(
  '{/* Tabel */}',
  '{!showForm && (\n        <>\n      {/* Tabel */}'
);

content = content.replace(
  '        {/* Pagination Footer */}',
  '      {/* Pagination Footer */}' // Keep it consistent
);

// We find the last </div>\n    </div>\n  );\n}
const lastDivs = content.lastIndexOf('</div>\n    </div>\n  );\n}');
if (lastDivs !== -1) {
  const uptDialog = `
      {/* UPT Modal Dialog */}
      {showUptDialog && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowUptDialog(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span style={{ fontSize: 16, fontWeight: 700 }}>Pilih UPT</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowUptDialog(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 12, top: 10, color: "#94A3B8" }} size={16} />
                <input 
                  className="form-input" 
                  placeholder="Cari UPT..." 
                  value={uptSearch} 
                  onChange={(e) => setUptSearch(e.target.value)} 
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                <div 
                  style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", cursor: "pointer", background: form.unit === "DINKES" ? "#F1F5F9" : "transparent" }}
                  onClick={() => { setForm({ ...form, unit: "DINKES" }); setShowUptDialog(false); }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>Dinas Kesehatan</div>
                </div>
                {upts.filter(u => u.nm_upt?.toLowerCase().includes(uptSearch.toLowerCase()) || u.kd_upt?.includes(uptSearch)).map(u => (
                  <div 
                    key={u.id}
                    style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", cursor: "pointer", background: form.unit === u.kd_upt ? "#F1F5F9" : "transparent" }}
                    onClick={() => { setForm({ ...form, unit: u.kd_upt || "" }); setShowUptDialog(false); }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{u.nm_upt}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Kode: {u.kd_upt} | Tipe: {u.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
`;
  content = content.substring(0, lastDivs) + '\n        </>\n      )}\n' + uptDialog + '\n    </div>\n    </div>\n  );\n}';
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated page.tsx successfully.");
