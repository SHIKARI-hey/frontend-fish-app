import { recordUserLogin } from "./supabase";

export interface UserAccount {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  farmName?: string;
  isGoogleSignedIn: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  lastLoginAt: string;
}

const STORAGE_KEY = "registered_user_accounts_v1";

export function getRegisteredAccounts(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading registered accounts:", err);
    return [];
  }
}

export function saveRegisteredAccounts(accounts: UserAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error("Error saving registered accounts:", err);
  }
}

export function findAccountByIdentifier(identifier: string): UserAccount | undefined {
  if (!identifier) return undefined;
  const accounts = getRegisteredAccounts();
  const cleanId = (identifier || "").toString().trim().toLowerCase().replace(/\s+/g, "");
  return accounts.find(
    (acc) =>
      (acc.email && acc.email.toLowerCase() === cleanId) ||
      (acc.phone && acc.phone.replace(/\s+/g, "") === cleanId) ||
      acc.name.toLowerCase() === cleanId
  );
}

export function registerOrLoginAccount(details: {
  name: string;
  phone?: string;
  email?: string;
  farmName?: string;
  isGoogle?: boolean;
}): { account: UserAccount; isExisting: boolean } {
  const accounts = getRegisteredAccounts();
  const now = new Date().toISOString();

  const isGlobalOnboardingDone = typeof window !== "undefined" && localStorage.getItem("user_onboarding_completed") === "true";

  // Check if account already exists
  let existingIndex = -1;
  if (details.email) {
    existingIndex = accounts.findIndex(
      (a) => a.email && a.email.toLowerCase() === (details.email || "").toLowerCase()
    );
  }
  if (existingIndex === -1 && details.phone) {
    existingIndex = accounts.findIndex(
      (a) => a.phone && a.phone.replace(/\s+/g, "") === (details.phone || "").replace(/\s+/g, "")
    );
  }
  if (existingIndex === -1 && details.name && !details.isGoogle) {
    existingIndex = accounts.findIndex((a) => a.name.toLowerCase() === details.name.toLowerCase());
  }

  // Trigger real-time tracking to Supabase & Central Server
  try {
    const profilePic = typeof window !== "undefined" ? localStorage.getItem("user_profile_image") || undefined : undefined;
    recordUserLogin({
      email: details.email,
      name: details.name,
      avatar_url: profilePic,
      auth_provider: details.isGoogle ? "google" : (details.email ? "email" : "phone"),
      farm_name: details.farmName || "My Fish Farm",
    }).catch(() => {});
  } catch {}

  if (existingIndex >= 0) {
    const existing = accounts[existingIndex];
    existing.lastLoginAt = now;
    if (details.isGoogle) existing.isGoogleSignedIn = true;
    if (details.name && details.name !== "Farmer" && details.name !== "Google Farmer") {
      existing.name = details.name;
    }
    if (details.phone && !existing.phone) existing.phone = details.phone;
    if (details.email && !existing.email) existing.email = details.email;
    if (details.farmName && !existing.farmName) existing.farmName = details.farmName;
    
    // Always preserve onboarding completed status if it was completed before
    if (isGlobalOnboardingDone || existing.onboardingCompleted) {
      existing.onboardingCompleted = true;
    }
    saveRegisteredAccounts(accounts);

    // Save Active Session
    localStorage.setItem("user_name", existing.name);
    if (existing.phone) localStorage.setItem("user_phone", existing.phone);
    if (existing.email) localStorage.setItem("user_email", existing.email);
    if (existing.farmName) localStorage.setItem("user_farm_name", existing.farmName);
    if (existing.isGoogleSignedIn) localStorage.setItem("user_google_signed_in", "true");
    localStorage.setItem("user_logged_in", "true");

    if (existing.onboardingCompleted || isGlobalOnboardingDone) {
      localStorage.setItem("user_onboarding_completed", "true");
    }

    return { account: existing, isExisting: true };
  } else {
    const newAccount: UserAccount = {
      id: "usr_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: details.name || "Farmer",
      phone: details.phone,
      email: details.email || (details.isGoogle ? "google.farmer@gmail.com" : undefined),
      farmName: details.farmName || "My Fish Farm",
      isGoogleSignedIn: !!details.isGoogle,
      // If it's a Google sign in or global onboarding was done, mark completed so they go straight to dashboard
      onboardingCompleted: Boolean(details.isGoogle || isGlobalOnboardingDone),
      createdAt: now,
      lastLoginAt: now,
    };

    accounts.push(newAccount);
    saveRegisteredAccounts(accounts);

    // Save Active Session
    localStorage.setItem("user_name", newAccount.name);
    if (newAccount.phone) localStorage.setItem("user_phone", newAccount.phone);
    if (newAccount.email) localStorage.setItem("user_email", newAccount.email);
    if (newAccount.farmName) localStorage.setItem("user_farm_name", newAccount.farmName);
    if (newAccount.isGoogleSignedIn) localStorage.setItem("user_google_signed_in", "true");
    localStorage.setItem("user_logged_in", "true");
    
    if (newAccount.onboardingCompleted) {
      localStorage.setItem("user_onboarding_completed", "true");
    }

    return { account: newAccount, isExisting: false };
  }
}

export function markCurrentAccountOnboardingComplete(farmName?: string): void {
  const currentEmail = localStorage.getItem("user_email");
  const currentPhone = localStorage.getItem("user_phone");
  const currentName = localStorage.getItem("user_name");

  const accounts = getRegisteredAccounts();
  let acc = accounts.find(
    (a) =>
      (currentEmail && a.email && a.email.toLowerCase() === currentEmail.toLowerCase()) ||
      (currentPhone && a.phone && (a.phone || "").replace(/\s+/g, "") === (currentPhone || "").replace(/\s+/g, "")) ||
      (currentName && a.name === currentName)
  );

  if (acc) {
    acc.onboardingCompleted = true;
    if (farmName) acc.farmName = farmName;
    saveRegisteredAccounts(accounts);
  } else {
    const newAcc: UserAccount = {
      id: "usr_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: currentName || "Farmer",
      phone: currentPhone || undefined,
      email: currentEmail || undefined,
      farmName: farmName || "My Fish Farm",
      isGoogleSignedIn: localStorage.getItem("user_google_signed_in") === "true",
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    accounts.push(newAcc);
    saveRegisteredAccounts(accounts);
  }

  localStorage.setItem("user_onboarding_completed", "true");
  localStorage.setItem("user_logged_in", "true");
}

export function deleteAccountById(id: string): void {
  const accounts = getRegisteredAccounts().filter((a) => a.id !== id);
  saveRegisteredAccounts(accounts);
}
