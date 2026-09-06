// src/lib/supabase.ts — Centralized user login tracker with Supabase integration & server fallback

export interface UserLoginRecord {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  auth_provider: "google" | "email" | "phone";
  farm_name?: string;
  last_login_at: string;
  created_at: string;
  login_count?: number;
}

// Read Supabase credentials from localStorage override (set by admin) or env vars
export function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = "";
  let anonKey = "";

  if (typeof window !== "undefined") {
    url = localStorage.getItem("supabase_url") || "";
    anonKey = localStorage.getItem("supabase_anon_key") || "";
  }

  if (!url) {
    url = (import.meta.env.VITE_SUPABASE_URL as string) || "";
  }
  if (!anonKey) {
    anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";
  }

  return {
    url: url.trim().replace(/\/+$/, ""),
    anonKey: anonKey.trim(),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase_url", url.trim().replace(/\/+$/, ""));
    localStorage.setItem("supabase_anon_key", anonKey.trim());
  }
}

/**
 * Logs a user login event.
 * First tries Supabase REST API (if configured).
 * Also posts to `/api/log-login` so the server maintains a live memory registry.
 */
export async function recordUserLogin(data: {
  email?: string;
  name?: string;
  avatar_url?: string;
  auth_provider?: "google" | "email" | "phone";
  farm_name?: string;
}): Promise<boolean> {
  const email = (data.email || "").trim().toLowerCase();
  if (!email && !data.name) return false;

  const now = new Date().toISOString();
  const recordId = email ? "usr_" + btoa(email).replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) : "usr_" + Date.now().toString(36);

  const payload: UserLoginRecord = {
    id: recordId,
    email: email || "unknown@farmer.org",
    name: data.name || "Aquaculture Farmer",
    avatar_url: data.avatar_url,
    auth_provider: data.auth_provider || "google",
    farm_name: data.farm_name || "My Fish Farm",
    last_login_at: now,
    created_at: now,
    login_count: 1,
  };

  // 1. Send to server-side endpoint (/api/log-login)
  try {
    fetch("/api/log-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {}

  // 2. Direct Supabase PostgREST sync if credentials exist
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      // Upsert into Supabase user_logins table
      const res = await fetch(`${url}/rest/v1/user_logins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.warn("Supabase recordUserLogin error:", err);
    }
  }

  return true;
}

/**
 * Fetch all login records for the Admin dashboard.
 * Queries Supabase first (if configured), then server endpoint, then local accounts.
 */
export async function fetchAllUserLogins(): Promise<UserLoginRecord[]> {
  const { url, anonKey } = getSupabaseConfig();

  // 1. Try Supabase
  if (url && anonKey) {
    try {
      const res = await fetch(`${url}/rest/v1/user_logins?select=*&order=last_login_at.desc`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (err) {
      console.warn("Error fetching from Supabase:", err);
    }
  }

  // 2. Try Server memory endpoint
  try {
    const res = await fetch("/api/admin/logins");
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch {}

  // 3. Fallback: retrieve from localStorage user accounts
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("fishfarm_registered_accounts");
      if (raw) {
        const local = JSON.parse(raw);
        if (Array.isArray(local)) {
          return local.map((acc: any) => ({
            id: acc.id || "usr_" + Math.random().toString(36).slice(2),
            email: acc.email || "No email",
            name: acc.name || "Farmer",
            auth_provider: acc.isGoogleSignedIn ? "google" : "email",
            farm_name: acc.farmName || "My Fish Farm",
            last_login_at: acc.lastLoginAt || acc.createdAt || new Date().toISOString(),
            created_at: acc.createdAt || new Date().toISOString(),
          }));
        }
      }
    } catch {}
  }

  return [];
}
