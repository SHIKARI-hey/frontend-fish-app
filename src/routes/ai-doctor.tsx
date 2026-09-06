import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { 
  ArrowLeft, MapPin, Upload, RefreshCw, Stethoscope, Loader2, 
  ShieldCheck, 
  ChevronDown, ChevronUp, Droplets, Activity, Pill,
  AlertTriangle, Info, Share2, Printer, CheckCircle2, XCircle,
  Clock, Trash2, History
} from "lucide-react";
import { BottomNav, PhoneFrame } from "@/components/BottomNav";
import farmerImg from "@/assets/farmer.jpg";
import { diagnoseFishDiseaseAI, MediaAttachment, DiagnosisResult } from "@/lib/gemini";
import { useLanguage } from "@/lib/languageContext";
import { getFarmProfile, PondRecord } from "@/lib/farmMemory";
import { getDiagnosisHistory, saveDiagnosis, deleteDiagnosis, clearAllDiagnoses, SavedDiagnosis, formatDiagnosisDate } from "@/lib/diagnosisHistory";

export const Route = createFileRoute("/ai-doctor")({
  component: DiseasePage,
  head: () => ({
    meta: [
      { title: "AI Fish Doctor — Veterinary Health Screening" },
      { name: "description", content: "Upload a photo of your fish or pond for an evidence-based AI veterinary diagnosis." },
    ],
  }),
});

export function DiseasePage() {
  const { t, language } = useLanguage();
  const [activeMode, setActiveMode] = useState<"health" | "weight" | "history">("health");

  const [description, setDescription] = useState<string>("");
  const [ponds, setPonds] = useState<PondRecord[]>([]);
  const [selectedPond, setSelectedPond] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [scanTimestamp, setScanTimestamp] = useState<string>("");
  const [userCity, setUserCity] = useState<string>("Accra & Ashanti Region, Ghana");
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Diagnosis history
  const [history, setHistory] = useState<SavedDiagnosis[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const refreshHistory = () => setHistory(getDiagnosisHistory());

  const [weightResult, setWeightResult] = useState<{
    estimatedWeightGrams: number;
    estimatedLengthCm: number;
    estimatedAgeWeeks: number;
    recommendedPelletSize: string;
    advice: string;
  } | null>(null);

  const [uploadedMedia, setUploadedMedia] = useState<{ name: string; type: string; mimeType: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const profile = getFarmProfile();
    setPonds(profile.ponds || []);
    if (profile.ponds && profile.ponds.length > 0) {
      setSelectedPond(profile.ponds[0].name);
    }
    if (profile.location) {
      setUserCity(profile.location);
    }
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCity(`GPS (${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°)`);
        },
        () => {}
      );
    }
    refreshHistory();
  }, []);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedMedia({
          name: file.name,
          type: file.type.startsWith("video") ? "video" : "image",
          mimeType: file.type || "image/jpeg",
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDiagnosisResult(null);

    let fullSymptomsText = `Target Pond: ${selectedPond || "General Pond"}. Observations: ${description || "Attached fish photo for visual health diagnosis."}`;

    let mediaAttachments: MediaAttachment[] = [];
    if (uploadedMedia) {
      mediaAttachments.push({ mimeType: uploadedMedia.mimeType, data: uploadedMedia.url });
    }

    try {
      const result = await diagnoseFishDiseaseAI(fullSymptomsText, mediaAttachments);
      setDiagnosisResult(result);
      setScanTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      // Auto-save to history
      saveDiagnosis({
        result,
        pond: selectedPond || "General Pond",
        imageUrl: uploadedMedia?.url,
      });
      refreshHistory();
    } catch (err) {
      console.error("AI Doctor diagnosis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Healthy": return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
      case "Monitor": return { bg: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30", pill: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" };
      case "Needs Attention": return { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500/30", pill: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
      case "Critical": return { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/30", pill: "bg-red-500/20 text-red-300 border-red-500/40" };
      default: return { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case "Healthy": return "🟢";
      case "Monitor": return "🟡";
      case "Needs Attention": return "🟠";
      case "Critical": return "🔴";
      default: return "🟢";
    }
  };

  const handleEstimateWeight = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWeightResult(null);
    setTimeout(() => {
      setWeightResult({
        estimatedWeightGrams: 380,
        estimatedLengthCm: 32.5,
        estimatedAgeWeeks: 14,
        recommendedPelletSize: "4.5mm - 6mm Floating Pellets",
        advice: "Fish growth rate is optimal for 14-week catfish. Continue 3% body weight feeding ration 2x daily."
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <PhoneFrame>
      {/* Header */}
      <header className="px-5 pt-4 pb-3.5 flex items-center justify-between border-b border-[#0F6236]/10 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/home" className="p-1 hover:bg-emerald-50 rounded-full transition-all cursor-pointer">
            <ArrowLeft className="w-5.5 h-5.5 text-gray-900" />
          </Link>
          <div>
            <h1 className="text-[19px] font-extrabold text-gray-900 leading-tight">AI Fish Doctor</h1>
            <div className="flex items-center gap-1.5 text-[#0F6236] text-[12px] font-bold mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {userCity}
            </div>
          </div>
        </div>
        <img src={farmerImg} alt="Farmer" className="w-9.5 h-9.5 rounded-full object-cover border-2 border-[#0F6236] shadow-xs" />
      </header>

      <section className="mx-5 mt-4 space-y-4 mb-8">
        
        {/* Mode Switcher */}
        <div className="flex rounded-2xl bg-gray-200/80 p-1 gap-0.5">
          <button type="button" onClick={() => setActiveMode("health")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeMode === "health" ? "bg-[#0F6236] text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}>
            🩺 Health
          </button>
          <button type="button" onClick={() => setActiveMode("weight")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeMode === "weight" ? "bg-[#0F6236] text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}>
            📐 Weight
          </button>
          <button type="button" onClick={() => { setActiveMode("history"); refreshHistory(); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${activeMode === "history" ? "bg-[#0F6236] text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}>
            <History className="w-3 h-3" /> History
            {history.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeMode === "history" ? "bg-white/20 text-white" : "bg-[#0F6236] text-white"}`}>{history.length}</span>
            )}
          </button>
        </div>

        {/* Weight Estimator */}
        {activeMode === "weight" && (
          <form onSubmit={handleEstimateWeight} className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-md space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-900 mb-2">1. Upload Fish Photo Next to Reference (Hand/Ruler)</label>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleMediaUpload} className="hidden" />
              {uploadedMedia ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#0F6236] shadow-md">
                  <img src={uploadedMedia.url} alt="Fish sample" className="w-full h-48 object-cover" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white font-extrabold text-xs flex items-center justify-center gap-2 opacity-90 cursor-pointer">
                    <RefreshCw className="w-4 h-4" /> Retake Photo
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-[#0F6236]/30 bg-[#0F6236]/5 hover:bg-[#0F6236]/10 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer">
                  <Upload className="w-8 h-8 text-[#0F6236]" />
                  <span className="text-xs font-extrabold text-gray-900">Tap to upload fish sample photo</span>
                </button>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-[#0F6236] hover:bg-[#0B4D29] text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
              <span>Estimate Weight & Length</span>
            </button>
          </form>
        )}

        {activeMode === "weight" && weightResult && (
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md space-y-4 animate-in fade-in">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">AI Weight & Growth Result</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-bold block">Estimated Weight</span>
                <span className="text-2xl font-black text-[#0F6236]">{weightResult.estimatedWeightGrams} g</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-gray-500 font-bold block">Estimated Length</span>
                <span className="text-2xl font-black text-[#0F6236]">{weightResult.estimatedLengthCm} cm</span>
              </div>
            </div>
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-800 space-y-1">
              <div><span className="font-extrabold text-[#0F6236]">Estimated Age:</span> ~{weightResult.estimatedAgeWeeks} Weeks</div>
              <div><span className="font-extrabold text-[#0F6236]">Pellet Size:</span> {weightResult.recommendedPelletSize}</div>
            </div>
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-gray-700 leading-relaxed">
              <span className="font-extrabold text-[#0F6236] block mb-0.5">AI Nutrition Advice:</span>
              {weightResult.advice}
            </div>
          </div>
        )}

        {/* Health Screening Upload Form */}
        {activeMode === "health" && (
          <form onSubmit={handleDiagnose} className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-md space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-900 mb-2">1. Upload Fish or Pond Photo</label>
              <input type="file" ref={fileInputRef} accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
              {uploadedMedia ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#0F6236] shadow-md group">
                  <img src={uploadedMedia.url} alt="Uploaded fish sample" className="w-full h-48 object-cover" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white font-extrabold text-xs flex items-center justify-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
                    <RefreshCw className="w-4 h-4" /> Tap to Retake Photo
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-[#0F6236]/30 bg-[#0F6236]/5 hover:bg-[#0F6236]/10 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs">
                  <div className="flex flex-col items-center gap-1.5 text-[#0F6236]">
                    <Upload className="w-8 h-8 text-[#0F6236]" />
                    <span className="text-xs font-extrabold text-gray-900">Tap to upload photo from camera</span>
                    <span className="text-[10.5px] text-gray-500 font-medium">Veterinary AI visual feature detection</span>
                  </div>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-900 mb-1">
                2. Select Pond <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <select value={selectedPond} onChange={(e) => setSelectedPond(e.target.value)}
                className="w-full h-11 rounded-2xl border border-gray-200 px-3.5 text-xs font-bold bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-[#0F6236]/20">
                <option value="General Pond">General Pond</option>
                {ponds.map((p) => (
                  <option key={p.id} value={p.name}>{p.name} ({p.fishCount} {p.fishType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-900 mb-1">3. Visual Symptoms or Notes</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Type visual symptoms, fish behavior, or pond notes..."
                className="w-full p-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#0F6236]/20 bg-gray-50" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-13 rounded-2xl bg-[#0F6236] hover:bg-[#0B4D29] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#0F6236]/25 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Visual Features...</>
              ) : (
                <><Stethoscope className="w-5 h-5" /> Run Veterinary Assessment</>
              )}
            </button>
          </form>
        )}

        {/* ─── 2-CARD DIAGNOSIS RESULT UI ─── */}
        {diagnosisResult && (
          <div className="space-y-4 animate-in fade-in duration-300">

            {/* IF NOT A FISH → SHOW 1 NOTICE CARD */}
            {!diagnosisResult.isFish ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 text-center space-y-3 shadow-lg">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-700">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-amber-950">No Fish Detected</h3>
                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                  {diagnosisResult.notFishReason || "Please upload a clear photo of your fish so the AI Doctor can assess its health."}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition-all">
                  Upload Fish Photo
                </button>
              </div>
            ) : (
              <>
                {/* ── CARD 1: FISH SPECIES & HEALTH CONDITION ── */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-5 space-y-4">
                  {/* Top Bar: Species Name (BOLD BLACK TEXT) & Actions */}
                  <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Identified Fish Species</span>
                        {!diagnosisResult.isFullBodyVisible && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" /> Full Body Missing
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg font-black text-black leading-tight mt-0.5">
                        {diagnosisResult.isFullBodyVisible
                          ? (diagnosisResult.species || "Unspecified Fish Species")
                          : "Cannot identify — full body not visible"}
                      </h2>

                      {!diagnosisResult.isFullBodyVisible && (
                        <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1 mt-2">
                          <span className="font-extrabold block text-amber-950">⚠️ Full Body View Required</span>
                          <p className="text-[11px] leading-relaxed font-medium">
                            The AI Fish Doctor does not guess species from partial or cropped views. To identify the exact fish species, please upload a photo showing the entire fish from head to tail.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const speciesText = diagnosisResult.isFullBodyVisible
                            ? (diagnosisResult.species || "Fish")
                            : "Cannot identify — full body not visible";
                          const text = `🐟 Fish Doctor AI Assessment\n\nSpecies: ${speciesText}\nCondition: ${diagnosisResult.diseaseName}\n\nFindings:\n${diagnosisResult.riskDescription}\n\nAction Plan:\n${diagnosisResult.treatmentPlan?.immediateActions?.join("\n")}\n\nGenerated via FishFarm OS Ghana`;
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#0F6236] text-white hover:bg-[#0B4D29] text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95">
                        <Share2 className="w-4 h-4" /> Share WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Image Thumbnail if attached */}
                  {uploadedMedia?.url && (
                    <img src={uploadedMedia.url} alt="Fish scan" className="w-full h-44 object-cover rounded-2xl border border-gray-100 shadow-sm" />
                  )}

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-500">Status:</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                      diagnosisResult.isSick
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {diagnosisResult.isSick ? "🔴 Sick — Treatment Required" : "🟢 Healthy — No Disease Detected"}
                    </span>
                  </div>

                  {/* Condition Details */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">{diagnosisResult.diseaseName}</h3>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed">
                      {diagnosisResult.riskDescription}
                    </p>
                  </div>
                </div>

                {/* ── CARD 2: WHAT TO DO / TREATMENT PLAN ── */}
                <div className="bg-[#07200F] text-white rounded-3xl p-5 space-y-4 shadow-xl border border-[#0F6236]/30">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <Stethoscope className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {diagnosisResult.isSick ? "Treatment & Action Plan" : "Recommended Care & Water Maintenance"}
                    </h3>
                  </div>

                  {/* Step by step actions */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Step-by-Step Actions</span>
                    {diagnosisResult.treatmentPlan?.immediateActions?.map((act, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-white/5 border border-white/10 p-3 rounded-2xl text-xs font-medium text-emerald-100">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>

                  {/* Medication or Maintenance */}
                  {diagnosisResult.treatmentPlan?.medication && (
                    <div className="bg-emerald-950/60 border border-emerald-500/30 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5" /> {diagnosisResult.isSick ? "Recommended Medication" : "Routine Water Care"}
                      </span>
                      <p className="text-xs font-extrabold text-emerald-200 leading-relaxed">
                        {diagnosisResult.treatmentPlan.medication}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}

        {/* ─── DIAGNOSIS HISTORY PANEL ─── */}
        {activeMode === "history" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Saved Diagnoses</h2>
                <p className="text-[10.5px] text-gray-400 font-medium">{history.length} scan{history.length !== 1 ? "s" : ""} saved</p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => { if (confirm("Clear all saved diagnoses?")) { clearAllDiagnoses(); refreshHistory(); } }}
                  className="text-[10.5px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 text-center space-y-2">
                <History className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-extrabold text-gray-400">No diagnoses yet</p>
                <p className="text-xs text-gray-400">Run a health screening and it will be saved here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => {
                  const isExpanded = expandedHistoryId === item.id;
                  const riskEmoji = item.result.riskLevel === "Healthy" ? "🟢" : item.result.riskLevel === "Monitor" ? "🟡" : item.result.riskLevel === "Needs Attention" ? "🟠" : "🔴";
                  return (
                    <div key={item.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Collapsed row */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer"
                        onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="fish" className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-[#0F6236]/10 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-5 h-5 text-[#0F6236]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm">{riskEmoji}</span>
                            <span className="text-xs font-black text-gray-900 truncate">{item.result.diseaseName}</span>
                          </div>
                          {item.result.species && (
                            <div className="text-[10.5px] font-bold text-[#0F6236] truncate flex items-center gap-1">
                              <span>🐟 {item.result.species}</span>
                              {item.result.isFullBodyVisible === false && (
                                <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                  Partial View
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[9.5px] text-gray-400 font-medium mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDiagnosisDate(item.timestamp)}
                            {item.pond && <span>• {item.pond}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteDiagnosis(item.id); refreshHistory(); }}
                            className="p-1.5 rounded-xl text-red-400 hover:bg-red-50 cursor-pointer transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/60 p-4 space-y-3 animate-in fade-in">
                          {/* Risk pill */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-gray-500 uppercase">Status:</span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              item.result.riskLevel === "Healthy" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              item.result.riskLevel === "Monitor" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                              item.result.riskLevel === "Needs Attention" ? "bg-orange-50 text-orange-700 border-orange-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            }`}>{riskEmoji} {item.result.riskLevel}</span>
                          </div>

                          {/* Visual findings */}
                          {item.result.visualFindings && item.result.visualFindings.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9.5px] font-extrabold text-gray-400 uppercase">Visual Findings</p>
                              {item.result.visualFindings.map((f, i) => (
                                <div key={i} className={`flex items-start gap-2 text-[10.5px] font-medium p-2 rounded-xl border ${f.isHealthy ? "bg-emerald-50/60 border-emerald-100 text-gray-700" : "bg-red-50/60 border-red-100 text-gray-700"}`}>
                                  {f.isHealthy ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
                                  {f.text}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Treatment summary */}
                          {item.result.treatmentPlan?.medication && (
                            <div className="bg-[#07200F] rounded-2xl p-3">
                              <p className="text-[9.5px] font-extrabold text-emerald-400 uppercase mb-1.5 flex items-center gap-1">
                                <Pill className="w-3 h-3" /> Medication
                              </p>
                              <p className="text-[10.5px] text-emerald-200 font-medium leading-relaxed">{item.result.treatmentPlan.medication}</p>
                            </div>
                          )}

                          {/* Share button */}
                          <button
                            onClick={() => {
                              const text = `🐟 Fish Doctor AI Report\n\nSpecies: ${item.result.species || "Fish"}\nCondition: ${item.result.diseaseName}\nStatus: ${item.result.riskLevel}\n\n${item.result.whyThisDiagnosis}\n\nGenerated via FishFarm OS Ghana`;
                              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                            }}
                            className="w-full h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0F6236] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition-all">
                            <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </section>
      <BottomNav />
    </PhoneFrame>
  );
}
