import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Phone, MapPin, Award, Save, Camera, Building2, Target, CheckCircle2 } from "lucide-react";
import { BottomNav, PhoneFrame } from "@/components/BottomNav";
import farmerImg from "@/assets/farmer.jpg";
import { getFarmProfile, saveFarmProfile } from "@/lib/farmMemory";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "My Farm Profile — Fish Doctor" },
      { name: "description", content: "View and edit your farm profile and contact details." },
    ],
  }),
});

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfileState] = useState(getFarmProfile());
  const [farmerName, setFarmerName] = useState(profile.name || "Farmer Kofi");
  const [farmName, setFarmName] = useState(profile.farmName || "My Fish Farm");
  const [farmerPhone, setFarmerPhone] = useState(profile.phone || "+233 248785807");
  const [location, setLocation] = useState(profile.location || "Accra, Ghana");
  const [primaryGoal, setPrimaryGoal] = useState(profile.primaryGoal || "Increase Yield & Growth Rate");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    if (savedName) setFarmerName(savedName);

    const savedFarmName = localStorage.getItem("user_farm_name");
    if (savedFarmName) setFarmName(savedFarmName);

    const savedGoal = localStorage.getItem("user_primary_goal");
    if (savedGoal) setPrimaryGoal(savedGoal);

    const savedPic = localStorage.getItem("user_profile_image");
    if (savedPic) setProfilePic(savedPic);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePic(base64);
        localStorage.setItem("user_profile_image", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: farmerName,
      farmName,
      phone: farmerPhone,
      location,
      primaryGoal,
    };
    saveFarmProfile(updated);
    setProfileState(updated);

    localStorage.setItem("user_name", farmerName);
    localStorage.setItem("user_farm_name", farmName);
    localStorage.setItem("user_phone", farmerPhone);
    localStorage.setItem("user_primary_goal", primaryGoal);

    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <PhoneFrame>
      {/* Header */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#0F6236]/10 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/home" className="p-1 hover:bg-emerald-50 rounded-full">
            <ArrowLeft className="w-5.5 h-5.5 text-gray-900" />
          </Link>
          <h1 className="text-[19px] font-extrabold text-gray-900 leading-tight">Farmer Profile & Settings</h1>
        </div>
      </header>

      {/* Avatar Profile Section */}
      <section className="px-5 mt-5 text-center">
        <div className="relative w-24 h-24 mx-auto mb-3">
          <img
            src={profilePic || farmerImg}
            alt={farmerName}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#0F6236] shadow-xl shadow-[#0F6236]/25"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0F6236] text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:bg-[#0B4D29] transition-all"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <h2 className="text-lg font-extrabold text-gray-900">{farmerName}</h2>
        <p className="text-xs font-extrabold text-[#0F6236]">{farmName}</p>
      </section>

      {/* Editable Form */}
      <section className="px-5 mt-5 mb-6">
        <form onSubmit={handleSave} className="emerald-card p-5 rounded-3xl space-y-4 shadow-md">
          <div>
            <label className="block text-xs font-extrabold text-gray-900 mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#0F6236]" /> Full Name
            </label>
            <input
              type="text"
              required
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              className="w-full h-11 px-3.5 text-xs font-bold border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#0F6236]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-900 mb-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#0F6236]" /> Farm Name
            </label>
            <input
              type="text"
              required
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full h-11 px-3.5 text-xs font-bold border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#0F6236]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-900 mb-1 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#0F6236]" /> Phone Number
            </label>
            <input
              type="text"
              required
              value={farmerPhone}
              onChange={(e) => setFarmerPhone(e.target.value)}
              className="w-full h-11 px-3.5 text-xs font-bold border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#0F6236]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-900 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0F6236]" /> Location / Region
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-11 px-3.5 text-xs font-bold border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#0F6236]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-900 mb-1 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#0F6236]" /> Primary Goal
            </label>
            <select
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              className="w-full h-11 px-3.5 text-xs font-bold border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-[#0F6236]/20"
            >
              <option>Maximize Catfish Harvest Yield</option>
              <option>Scale Nile Tilapia Cage Farming</option>
              <option>Prevent Water Disease & Mortality</option>
              <option>Optimize Feed Conversion Ratio (FCR)</option>
            </select>
          </div>

          {savedMsg && (
            <div className="p-3 bg-emerald-100 text-[#0F6236] font-extrabold text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#0F6236]" /> Profile saved successfully!
            </div>
          )}

          <button
            type="submit"
            className="w-full h-12 rounded-2xl bg-[#0F6236] hover:bg-[#0B4D29] text-white font-extrabold text-xs shadow-lg shadow-[#0F6236]/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Save className="w-4 h-4 text-white" /> Save Profile Details
          </button>
        </form>
      </section>

      <BottomNav />
    </PhoneFrame>
  );
}
