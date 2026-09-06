import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Check, ChevronRight, ArrowLeft, Fish, Waves, Target, Globe, Video, UploadCloud, CheckCircle, Edit3, Search, Building2, MapPin } from "lucide-react";
import { useLanguage, SupportedLanguage } from "@/lib/languageContext";
import { saveFarmProfile, getFarmProfile } from "@/lib/farmMemory";

import { markCurrentAccountOnboardingComplete } from "@/lib/userAccounts";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "Onboarding — Fish Doctor App" },
      { name: "description", content: "Customize your global fish farm setup." },
    ],
  }),
});

const GLOBAL_FISH_SPECIES_LIST = [
  { id: "African Catfish", label: "African Catfish (Clarias gariepinus)", desc: "Air-breathing, fast growing" },
  { id: "Nile Tilapia", label: "Nile Tilapia (Oreochromis niloticus)", desc: "Herbivorous, pond & cage farming" },
  { id: "Both Catfish & Tilapia", label: "Both Catfish & Tilapia", desc: "Polyculture or multi-pond farm" },
  { id: "Heterotis", label: "Heterotis (Heterotis niloticus)", desc: "Large bony tongue freshwater species" },
  { id: "Carp (Common / Grass / Silver)", label: "Carp (Common / Grass / Silver)", desc: "Omnivorous, global pond aquaculture" },
  { id: "Rainbow Trout", label: "Rainbow Trout (Oncorhynchus mykiss)", desc: "Coldwater freshwater farming" },
  { id: "Atlantic Salmon", label: "Atlantic Salmon (Salmo salar)", desc: "High value marine & recirculating systems" },
  { id: "Pangasius Basa", label: "Pangasius Basa", desc: "River aquaculture & high density commercial ponds" },
  { id: "Barramundi & Sea Bass", label: "Barramundi & Sea Bass", desc: "Brackish & marine coastal farming" },
  { id: "Red Snapper & Grouper", label: "Red Snapper & Grouper", desc: "Marine offshore & sea cage aquaculture" },
  { id: "Vannamei Shrimp & Prawns", label: "Vannamei Shrimp & Freshwater Prawns", desc: "Crustacean farming & brackish ponds" },
  { id: "Ornamental (Koi / Goldfish / Betta)", label: "Ornamental Fish (Koi, Goldfish, Betta)", desc: "Aquarium & ornamental breeding" },
  { id: "European Eel", label: "European Eel (Anguilla anguilla)", desc: "Specialized high-value aquaculture" },
  { id: "Sturgeon", label: "Sturgeon (Acipenser)", desc: "Coldwater tank aquaculture" },
  { id: "Other", label: "Other / Specify Custom Fish", desc: "Type your exact fish or aquatic species name" },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setLanguage } = useLanguage();
  const [step, setStep] = useState(1);

  // Form selections
  const [farmName, setFarmName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fishType, setFishType] = useState<string>("African Catfish");
  const [customFishName, setCustomFishName] = useState<string>("");
  const [pondCount, setPondCount] = useState<string>("3-5 Ponds");
  const [primaryGoal, setPrimaryGoal] = useState<string>("Increase Yield & Growth Rate");
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("English");

  // Optional Pond Video State
  const [pondVideo, setPondVideo] = useState<{ name: string; url: string } | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 4;

  const handlePondVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPondVideo({
          name: file.name,
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredSpecies = GLOBAL_FISH_SPECIES_LIST.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFinish = () => {
    try {
      const finalFishType = fishType === "Other" && customFishName.trim() ? customFishName.trim() : fishType;
      const finalFarmName = farmName.trim() || "My Fish Farm";
      
      const profile = getFarmProfile();
      profile.farmName = finalFarmName;
      profile.primaryGoal = primaryGoal;
      profile.experienceLevel = primaryGoal;
      saveFarmProfile(profile);

      localStorage.setItem("user_farm_name", finalFarmName);
      localStorage.setItem("user_primary_goal", primaryGoal);
      localStorage.setItem("user_fish_species", finalFishType);
      localStorage.setItem("user_onboarding_completed", "true");
      localStorage.setItem("user_logged_in", "true");
      try { markCurrentAccountOnboardingComplete(finalFarmName); } catch (e) { console.warn(e); }
      setLanguage(selectedLang);
      window.location.href = "/home";
    } catch (err) {
      console.error("Onboarding finish error", err);
      localStorage.setItem("user_onboarding_completed", "true");
      localStorage.setItem("user_logged_in", "true");
      window.location.href = "/home";
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!farmName.trim()) {
        alert("Please enter a name for your fish farm!");
        return;
      }
      if (fishType === "Other" && !customFishName.trim()) {
        alert("Please specify your custom fish or aquatic species name!");
        return;
      }
    }

    if (step < totalSteps) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFEA] flex justify-center items-center font-sans antialiased sm:py-4">
      <main className="w-full max-w-[430px] min-h-screen sm:min-h-[820px] bg-[#FAFCFA] relative flex flex-col justify-between overflow-hidden shadow-2xl sm:rounded-[36px] sm:border sm:border-gray-200">
        
        {/* Header Bar - Top-Right Skip Button Removed */}
        <div className="px-6 pt-6 flex items-center justify-between z-10">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          {/* Progress Dots */}
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  step === idx + 1
                    ? "w-7 bg-[#0F6236]"
                    : step > idx + 1
                    ? "w-2 bg-[#0F6236]/60"
                    : "w-2 bg-gray-200"
                }`}
              />
            ))}
          </div>

          <div className="w-8" />
        </div>

        {/* Content Box */}
        <div className="px-6 py-5 flex-1 flex flex-col justify-between z-10">
          <div>
            {/* Step 1: Farm Name & Scrollable Fish Search */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#0F6236]/10 flex items-center justify-center text-[#0F6236] mb-3">
                  <Fish className="w-6 h-6" />
                </div>
                <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
                  Name Your Farm & Select Fish
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Fish Doctor AI configures feed calculations & AI health targets for your farm.
                </p>

                {/* Farm Name Input */}
                <div className="mt-3.5">
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#0F6236]" /> Name Your Fish Farm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Kofi's Fresh Fish Farm"
                    className="w-full h-11 px-3 text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0F6236]/20 shadow-xs"
                  />
                </div>

                {/* Search Bar for Fish Species */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-800">
                      Select Fish Species ({filteredSpecies.length})
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search fish species..."
                      className="w-full h-10 pl-9 pr-3 text-xs font-semibold text-gray-900 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0F6236]/20 shadow-xs"
                    />
                  </div>
                </div>

                {/* Long Scrollable Fish Species List (No Emojis) */}
                <div className="space-y-2 mt-3 max-h-[220px] overflow-y-auto pr-1">
                  {filteredSpecies.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFishType(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        fishType === item.id
                          ? "border-[#0F6236] bg-[#0F6236]/5 text-[#0F6236] font-bold shadow-xs"
                          : "border-gray-200 hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <div>
                        <div className="text-[13.5px] font-extrabold">{item.label}</div>
                        <div className="text-[11px] text-gray-500 font-normal">{item.desc}</div>
                      </div>
                      {fishType === item.id && <Check className="w-4 h-4 text-[#0F6236] shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* Custom Fish Input if "Other" is selected */}
                {fishType === "Other" && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-extrabold text-[#0F6236] flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Specify Custom Fish / Aquatic Species:
                    </label>
                    <input
                      type="text"
                      required
                      value={customFishName}
                      onChange={(e) => setCustomFishName(e.target.value)}
                      placeholder="e.g. Channel Catfish, Arapaima, Crawfish, Perch..."
                      className="w-full h-10 px-3 text-xs font-bold text-gray-900 bg-white border border-emerald-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0F6236]/20"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Pond Count & OPTIONAL Pond Video */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#0F6236]/10 flex items-center justify-center text-[#0F6236] mb-4">
                  <Waves className="w-6 h-6" />
                </div>
                <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
                  Pond Count & Inspection Video
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Select your pond count. Uploading a video of your pond is optional.
                </p>

                <div className="space-y-3 mt-4">
                  {[
                    { id: "1-2 Ponds", label: "1 - 2 Ponds", desc: "Small scale or backyard farming" },
                    { id: "3-5 Ponds", label: "3 - 5 Ponds", desc: "Commercial growing farm" },
                    { id: "6+ Ponds", label: "6+ Ponds or Cages", desc: "Large commercial production" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPondCount(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        pondCount === item.id
                          ? "border-[#0F6236] bg-[#0F6236]/5 text-[#0F6236] font-bold shadow-xs"
                          : "border-gray-200 hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <div>
                        <div className="text-[14px] font-bold">{item.label}</div>
                        <div className="text-xs text-gray-400 font-normal">{item.desc}</div>
                      </div>
                      {pondCount === item.id && <Check className="w-5 h-5 text-[#0F6236]" />}
                    </button>
                  ))}

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                      <Video className="w-4 h-4 text-[#0F6236]" /> Upload Pond Inspection Video <span className="text-gray-400 font-semibold">(Optional)</span>
                    </label>
                    
                    <input
                      type="file"
                      ref={videoInputRef}
                      accept="video/*,image/*"
                      onChange={handlePondVideoUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className={`w-full p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        pondVideo
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-[#0F6236]/30 bg-[#0F6236]/5 text-[#0F6236] hover:bg-[#0F6236]/10"
                      }`}
                    >
                      {pondVideo ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                          <span>Video Uploaded: {pondVideo.name}</span>
                          <span className="text-[10px] text-emerald-600 font-normal">Fish Doctor AI will inspect your water layout!</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-[#0F6236]" />
                          <span>Tap to Upload / Record Pond Video (Optional)</span>
                          <span className="text-[10.5px] text-gray-500 font-normal">Show your water layout or fish swimming</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Primary Farming Goal & AI Mandate */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#0F6236]/10 flex items-center justify-center text-[#0F6236] mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
                  What is your primary goal?
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Fish Doctor AI will adopt your selected goal as its primary mandate across all recommendations.
                </p>

                <div className="space-y-3 mt-6">
                  {[
                    { id: "Increase Yield & Growth Rate", label: "Increase Yield & Growth Rate", desc: "Reach target 1.2kg+ harvest weight faster" },
                    { id: "Prevent Disease & Mortality", label: "Prevent Fish Disease & Mortality", desc: "Monitor water parameters & fish health" },
                    { id: "Reduce Feed Costs & Waste", label: "Reduce Feed Costs & Waste", desc: "Optimize FCR (Feed Conversion Ratio)" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPrimaryGoal(item.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        primaryGoal === item.id
                          ? "border-[#0F6236] bg-[#0F6236]/5 text-[#0F6236] font-bold shadow-xs"
                          : "border-gray-200 hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <div>
                        <div className="text-[15px] font-bold">{item.label}</div>
                        <div className="text-xs text-gray-400 font-normal">{item.desc}</div>
                      </div>
                      {primaryGoal === item.id && <Check className="w-5 h-5 text-[#0F6236]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Language Selection */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#0F6236]/10 flex items-center justify-center text-[#0F6236] mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
                  Choose Preferred Language
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Fish Doctor AI will translate, type, and speak in your selected language audio.
                </p>

                <div className="space-y-2.5 mt-6">
                  {[
                    { id: "English", label: "English", flag: "🇬🇧" },
                    { id: "Twi", label: "Akan (Twi)", flag: "🇬🇭" },
                    { id: "Ga", label: "Ga-Adangme", flag: "🇬🇭" },
                    { id: "Ewe", label: "Eʋegbe (Ewe)", flag: "🇬🇭" },
                    { id: "Hausa", label: "Hausa", flag: "🇳🇬" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLang(lang.id as SupportedLanguage)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedLang === lang.id
                          ? "border-[#0F6236] bg-[#0F6236]/5 text-[#0F6236] font-bold shadow-xs"
                          : "border-gray-200 hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-[15px] font-semibold">{lang.label}</span>
                      </div>
                      {selectedLang === lang.id && <Check className="w-5 h-5 text-[#0F6236]" />}
                    </button>
                  ))}
                </div>

                {/* Location & Weather Permission Card */}
                <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#0F6236]" />
                    <span className="text-xs font-extrabold text-gray-900">Enable Location & Weather Alerts</span>
                  </div>
                  <p className="text-[11.5px] text-gray-600 leading-relaxed font-medium">
                    Allows Fish Doctor to send real-time rain warnings, temperature shift alerts, and daily feeding reminders for your farm location.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const profile = getFarmProfile();
                            profile.location = `GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`;
                            saveFarmProfile(profile);
                            alert("Location access granted! Weather & Rain notifications enabled for your farm.");
                          },
                          () => {
                            alert("Location access requested. You can also set location manually in Profile.");
                          }
                        );
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#0F6236] text-white font-extrabold text-xs shadow-md cursor-pointer hover:bg-[#0B4D29] transition-all"
                  >
                    Allow Location & Weather Alerts
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Continue / Finish Button */}
          <button
            onClick={handleNext}
            className="w-full h-13 mt-6 bg-[#0F6236] hover:bg-[#0B502B] text-white font-extrabold text-[15.5px] rounded-2xl shadow-lg shadow-[#0F6236]/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            {step === totalSteps ? (
              <>Finish & Go to Dashboard</>
            ) : (
              <>
                Next <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
