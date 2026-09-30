import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ShieldAlert, Key, Users, Eye, EyeOff, Trash2, Search, 
  Download, CheckCircle2, XCircle, RefreshCw, Lock, LogOut, Database,
  Copy, Check, ExternalLink, HelpCircle, Mail, Sparkles
} from "lucide-react";

import { 
  fetchAllUserLogins, 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  UserLoginRecord 
} from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Console — Fish Doctor User & System Management" },
      { name: "description", content: "View all user logins, Gmail accounts, and manage Supabase database connection." },
    ],
  }),
});

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const [logins, setLogins] = useState<UserLoginRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Supabase Settings
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");
  const [supabaseKey, setSupabaseKey] = useState<string>("");
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string>("");
  const [showSupabaseGuide, setShowSupabaseGuide] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_authenticated_v1");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      initAdminData();
    }
  }, []);

  const initAdminData = async () => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.anonKey);
    if (config.url && config.anonKey) {
      setIsSupabaseConnected(true);
    }
    await refreshLogins();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "1222") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated_v1", "true");
      setPasswordError("");
      initAdminData();
    } else {
      setPasswordError("Incorrect Admin password (default: 1222). Please try again.");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("admin_authenticated_v1");
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  const refreshLogins = async () => {
    setLoading(true);
    try {
      const records = await fetchAllUserLogins();
      setLogins(records);
    } catch (err) {
      console.error("Failed to load user logins:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestStatus("Testing connection...");
    saveSupabaseConfig(supabaseUrl, supabaseKey);

    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setIsSupabaseConnected(false);
      setTestStatus("Supabase configuration cleared.");
      return;
    }

    try {
      const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");
      const res = await fetch(`${cleanUrl}/rest/v1/user_logins?select=count`, {
        headers: {
          apikey: supabaseKey.trim(),
          Authorization: `Bearer ${supabaseKey.trim()}`,
        },
      });

      if (res.ok || res.status === 200 || res.status === 206) {
        setIsSupabaseConnected(true);
        setTestStatus("✅ Successfully connected to Supabase!");
        await refreshLogins();
      } else if (res.status === 404 || res.status === 400) {
        setIsSupabaseConnected(false);
        setTestStatus("⚠️ Connected to Supabase, but the 'user_logins' table does not exist yet. Run the SQL script below!");
      } else {
        setIsSupabaseConnected(false);
        setTestStatus(`❌ Supabase error: HTTP ${res.status}`);
      }
    } catch (err: any) {
      setIsSupabaseConnected(false);
      setTestStatus(`❌ Could not connect: ${err.message || "Network error"}`);
    }
  };

  const handleCopySql = () => {
    const sql = `-- Run this in Supabase SQL Editor:
create table if not exists user_logins (
  id text primary key,
  email text,
  name text,
  avatar_url text,
  auth_provider text default 'google',
  farm_name text default 'My Fish Farm',
  last_login_at timestamptz default now(),
  created_at timestamptz default now(),
  login_count integer default 1
);

-- Enable open insert/read for authenticated & anon client requests
alter table user_logins enable row level security;
create policy "Allow client insert" on user_logins for insert with check (true);
create policy "Allow client update" on user_logins for update using (true);
create policy "Allow client select" on user_logins for select using (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleExportCSV = () => {
    if (logins.length === 0) return alert("No logins to export!");
    const headers = ["Email", "Full Name", "Provider", "Farm Name", "Last Login", "Created At"];
    const rows = logins.map(l => [
      `"${l.email || ""}"`,
      `"${l.name || ""}"`,
      `"${l.auth_provider || "google"}"`,
      `"${l.farm_name || "My Fish Farm"}"`,
      `"${l.last_login_at || ""}"`,
      `"${l.created_at || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fish_doctor_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredLogins = logins.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.farm_name && item.farm_name.toLowerCase().includes(q))
    );
  });

  // ── Password Gate Screen ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="px-5 py-4 flex items-center gap-3 border-b border-gray-200 bg-white shadow-xs">
          <div className="w-9 h-9 rounded-2xl bg-[#0F6236] text-white flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-extrabold text-gray-900">Fish Doctor — Admin</h1>
        </header>

        <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#0F6236] text-white flex items-center justify-center shadow-xl shadow-[#0F6236]/30 mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Admin Access Only</h2>
          <p className="text-xs text-gray-500 font-medium mb-6 max-w-[260px]">
            Enter your 4-digit PIN to inspect all registered Gmail accounts and manage database routing.
          </p>

          <form onSubmit={handlePasswordSubmit} className="w-full max-w-[340px] space-y-4">
            <input
              type="password"
              maxLength={10}
              required
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter PIN"
              className="w-full h-13 rounded-2xl border border-gray-300 text-center text-lg font-mono font-extrabold text-gray-900 bg-white shadow-xs outline-none focus:ring-2 focus:ring-[#0F6236]"
            />

            {passwordError && (
              <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-13 rounded-2xl bg-[#0F6236] hover:bg-[#0B4D29] text-white font-extrabold text-sm shadow-lg shadow-[#0F6236]/25 cursor-pointer transition-all active:scale-95"
            >
              Unlock Admin Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-gray-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#0F6236] text-white flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight">Admin Console</h1>
            <div className="text-xs font-bold text-gray-500">Live User Accounts & Supabase</div>
          </div>
        </div>
        <button onClick={handleAdminLogout} title="Lock Console" className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="p-5 space-y-5 pb-20 max-w-4xl mx-auto w-full">
        
        {/* ─── SUPABASE INTEGRATION & SETUP PANEL ─── */}
        <section className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#0F6236]" />
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Supabase Central Database</h2>
                <p className="text-[11px] text-gray-500 font-medium">Store all logins & Gmail accounts in the cloud</p>
              </div>
            </div>
            <span className={`text-[10.5px] font-black px-2.5 py-1 rounded-full border ${
              isSupabaseConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}>
              {isSupabaseConnected ? "🟢 Connected" : "🟡 In-Memory Fallback"}
            </span>
          </div>

          <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full h-10 px-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0F6236]/20 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-700 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full h-10 px-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0F6236]/20 text-gray-900"
              />
            </div>

            {testStatus && (
              <div className={`p-2.5 rounded-xl text-xs font-bold ${
                testStatus.startsWith("✅") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                testStatus.startsWith("⚠️") ? "bg-amber-50 text-amber-800 border border-amber-200" :
                "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {testStatus}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 h-10 bg-[#0F6236] hover:bg-[#0B4D29] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" /> Save & Test Connection
              </button>
              <button
                type="button"
                onClick={() => setShowSupabaseGuide(!showSupabaseGuide)}
                className="px-3 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-extrabold rounded-xl cursor-pointer flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> {showSupabaseGuide ? "Hide Guide" : "Setup Help"}
              </button>
            </div>
          </form>

          {/* Collapsible Supabase Setup Instructions */}
          {showSupabaseGuide && (
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-xs space-y-3 animate-in fade-in">
              <h3 className="font-extrabold text-[#0F6236] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Exactly What to Get From Supabase:
              </h3>
              
              <ol className="list-decimal pl-4 space-y-1.5 text-gray-700 font-medium">
                <li>Create a free account at <strong>supabase.com</strong> and create a project.</li>
                <li>Go to <strong>Project Settings → API</strong> in your Supabase dashboard.</li>
                <li>Copy <strong>Project URL</strong> and paste into the box above.</li>
                <li>Copy <strong>anon / public API key</strong> and paste into the box above.</li>
                <li>Go to <strong>SQL Editor</strong> in Supabase and run the table creation script below:</li>
              </ol>

              <div className="relative bg-gray-900 text-emerald-400 p-3 rounded-xl font-mono text-[10.5px] overflow-x-auto">
                <pre>{`create table if not exists user_logins (
  id text primary key,
  email text,
  name text,
  avatar_url text,
  auth_provider text default 'google',
  farm_name text default 'My Fish Farm',
  last_login_at timestamptz default now(),
  created_at timestamptz default now(),
  login_count integer default 1
);
alter table user_logins enable row level security;
create policy "Allow client insert" on user_logins for insert with check (true);
create policy "Allow client update" on user_logins for update using (true);
create policy "Allow client select" on user_logins for select using (true);`}</pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-2 right-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedSql ? "Copied!" : "Copy SQL"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ─── REGISTERED ACCOUNTS & GMAIL LOGINS DIRECTORY ─── */}
        <section className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0F6236]" />
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">
                  Logged In Users ({logins.length})
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">Real-time Gmail accounts & login timestamps</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={refreshLogins}
                disabled={loading}
                title="Refresh user list"
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleExportCSV}
                title="Download CSV"
                className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-[#0F6236] text-white hover:bg-[#0B4D29] flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Gmail, name, or farm..."
              className="w-full h-10 pl-9 pr-3 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0F6236]/20"
            />
          </div>

          {/* Users List */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredLogins.length > 0 ? (
              filteredLogins.map((user) => {
                const isGoogle = user.auth_provider === "google" || (user.email && user.email.includes("@gmail.com"));
                return (
                  <div key={user.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-[#0F6236]/30 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-[#0F6236]/20 shrink-0" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 text-white ${
                          isGoogle ? "bg-gradient-to-tr from-blue-600 to-indigo-600" : "bg-[#0F6236]"
                        }`}>
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}

                      {/* Details */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-gray-900 truncate">
                            {user.name || "Farmer"}
                          </span>
                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                            isGoogle ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {isGoogle ? "Google Sign-In" : "Email"}
                          </span>
                        </div>

                        {/* Prominent Gmail address */}
                        <div className="text-xs font-black text-gray-900 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-[#0F6236] shrink-0" />
                          <span className="font-mono text-[11.5px] text-gray-900">{user.email}</span>
                        </div>

                        <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-2">
                          <span>{user.farm_name || "My Fish Farm"}</span>
                          <span>•</span>
                          <span>Last login: {new Date(user.last_login_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-xs text-gray-400 font-semibold space-y-1">
                <Users className="w-8 h-8 text-gray-300 mx-auto" />
                <p>No user accounts found matching "{searchQuery}".</p>
                <p className="text-[11px] text-gray-400">Log in via Google or Email on the login page to see new records appear.</p>
              </div>
            )}
          </div>
        </section>

      </div>

    </div>
  );
}
