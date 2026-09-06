import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Globe, Cpu, Volume2, Wifi, LogOut, ChevronRight, MapPin, ShieldAlert, Zap, Clock, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";
import { LanguageModal } from "@/components/ui/LanguageModal";
import { BottomNav, PhoneFrame } from "@/components/BottomNav";
import { PaymentModal } from "@/components/PaymentModal";
import { getSubscriptionStatus, SubscriptionStatus, PRO_MONTHLY_PRICE_GHC } from "@/lib/subscription";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "App Settings & Subscription — Fish Doctor" },
      { name: "description", content: "Configure voice language translation, subscription and offline AI settings." },
    ],
  }),
});

export function SettingsPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>(getSubscriptionStatus());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [farmerName, setFarmerName] = useState("Farmer Kofi");
  const [farmName, setFarmName] = useState("My Fish Farm");

  useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    if (savedName) setFarmerName(savedName);

    const savedFarm = localStorage.getItem("user_farm_name");
    if (savedFarm) setFarmName(savedFarm);

    setSubStatus(getSubscriptionStatus());
  }, []);

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out of your account?")) {
      localStorage.removeItem("user_logged_in");
      localStorage.removeItem("user_onboarding_completed");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_farm_name");
      localStorage.removeItem("user_phone");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_google_signed_in");
      navigate({ to: "/login" });
    }
  };

  return (
    <PhoneFrame>
      {/* Header */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#0F6236]/10 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/home" className="p-1 hover:bg-emerald-50 rounded-full">
            <ArrowLeft className="w-5.5 h-5.5 text-gray-900" />
          </Link>
          <h1 className="text-[19px] font-extrabold text-gray-900 leading-tight">Settings & Preferences</h1>
        </div>
      </header>

      {/* User Profile Bar */}
      <section className="mx-5 mt-4">
        <Link to="/profile" className="emerald-card p-4 rounded-3xl flex items-center justify-between shadow-md">
          <div>
            <div className="text-xs font-bold text-[#0F6236]">Logged in as</div>
            <div className="text-sm font-extrabold text-gray-900">{farmerName}</div>
            <div className="text-[11px] text-gray-500 font-semibold">{farmName}</div>
          </div>
          <span className="text-xs font-extrabold text-[#0F6236] bg-emerald-100 px-3 py-1.5 rounded-full">Edit Profile</span>
        </Link>
      </section>

      {/* Settings Options */}
      <section className="mx-5 mt-4 space-y-3 mb-6">
        {/* Subscription & Billing Card */}
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="w-full emerald-card p-4 rounded-3xl flex items-center justify-between hover:bg-emerald-50/50 transition-all text-left cursor-pointer shadow-xs border-2 border-[#0F6236]/20"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F6236] text-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <span>FishFarm OS Pro</span>
                {subStatus.isPro ? (
                  <span className="text-[10px] bg-emerald-100 text-[#0F6236] font-extrabold px-2 py-0.5 rounded-full">ACTIVE</span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">GH₵ 100/mo</span>
                )}
              </div>
              <div className="text-xs text-gray-500 font-bold">
                {subStatus.isPro ? "Pro Plan Activated (Unlimited)" : subStatus.formattedTimeLeft}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Language Selector */}
        <button
          onClick={() => setIsLangModalOpen(true)}
          className="w-full emerald-card p-4 rounded-3xl flex items-center justify-between hover:bg-emerald-50/50 transition-all text-left cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F6236]/10 text-[#0F6236] flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#0F6236]" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-gray-900">{t("chooseLanguage")}</div>
              <div className="text-xs text-gray-500 font-bold">Active: {language} (Twi & Audio Active)</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>


        {/* Voice Readout Toggle */}
        <div className="emerald-card p-4 rounded-3xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F6236]/10 text-[#0F6236] flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-[#0F6236]" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-gray-900">Voice Audio Output</div>
              <div className="text-xs text-gray-500 font-medium">Read AI advice in selected language audio</div>
            </div>
          </div>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-12 h-7 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              voiceEnabled ? "bg-[#0F6236]" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                voiceEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Custom Gemini API Key Settings */}
        <div className="emerald-card p-4 rounded-3xl space-y-2 shadow-xs border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F6236]/10 text-[#0F6236] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-[#0F6236]" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-gray-900">Google Gemini API Key</div>
              <div className="text-xs text-gray-500 font-medium">Enter your AIzaSy... key for direct Gemini Neural Voice</div>
            </div>
          </div>
          <input
            type="password"
            placeholder="Paste your Gemini API key (AIzaSy...)"
            defaultValue={typeof window !== "undefined" ? localStorage.getItem("user_gemini_api_key") || "" : ""}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (val) {
                localStorage.setItem("user_gemini_api_key", val);
              } else {
                localStorage.removeItem("user_gemini_api_key");
              }
            }}
            className="w-full h-10 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 outline-none focus:ring-2 focus:ring-[#0F6236]/20"
          />
        </div>

        {/* Log Out Button */}
        <button
          onClick={handleLogout}
          className="w-full p-4 rounded-3xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 flex items-center justify-between font-extrabold text-sm cursor-pointer transition-all active:scale-[0.98] shadow-xs"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-600" />
            <span>Sign Out of Account</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </button>
      </section>

      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} />
      <LanguageModal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} />
      <BottomNav />
    </PhoneFrame>
  );
}
