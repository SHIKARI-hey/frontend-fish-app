import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneCall, ArrowLeft, MapPin, UserCheck, ShieldCheck, Star, Calendar, MessageSquare } from "lucide-react";
import { BottomNav, PhoneFrame } from "@/components/BottomNav";
import supportImg from "@/assets/icons/support.png";
import farmerImg from "@/assets/farmer.jpg";

export const Route = createFileRoute("/extension-support")({
  component: ExtensionSupportPage,
  head: () => ({
    meta: [
      { title: "Aquaculture Extension Officers & Expert Support" },
      { name: "description", content: "Connect with certified Ministry of Fisheries extension officers in Ghana." },
    ],
  }),
});

interface ExtensionOfficer {
  id: string;
  name: string;
  region: string;
  phone: string;
  rating: number;
  specialty: string;
  availableDays: string;
  verified: boolean;
}

const certifiedOfficers: ExtensionOfficer[] = [
  {
    id: "o1",
    name: "Dimples",
    region: "All Regions & National Support, Ghana",
    phone: "+233 24 878 5807",
    rating: 5.0,
    specialty: "Aquaculture Extension Officer & Farm Advisory Specialist",
    availableDays: "24/7 National On-Call Support",
    verified: true,
  },
  {
    id: "o2",
    name: "Papa Quandoh",
    region: "All Regions & National Support, Ghana",
    phone: "+233 55 374 4813",
    rating: 5.0,
    specialty: "Fish Health Doctor & Technical Officer",
    availableDays: "24/7 National On-Call Support",
    verified: true,
  },
];

export function ExtensionSupportPage() {
  const [selectedOfficer, setSelectedOfficer] = useState<ExtensionOfficer | null>(null);

  return (
    <PhoneFrame>
      {/* Header */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#0F6236]/10 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/home" className="p-1 hover:bg-emerald-50 rounded-full">
            <ArrowLeft className="w-5.5 h-5.5 text-gray-900" />
          </Link>
          <h1 className="text-[19px] font-extrabold text-gray-900 leading-tight">Extension Officers Directory</h1>
        </div>
        <img src={supportImg} alt="Support" className="w-9 h-9 object-contain" />
      </header>

      {/* Hero Banner */}
      <section className="mx-5 mt-4 rounded-3xl bg-gradient-to-br from-[#09341D] via-[#0F6236] to-[#082917] text-white p-5 shadow-xl shadow-[#0F6236]/30 border border-emerald-500/20">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-extrabold uppercase tracking-wide">
          <ShieldCheck className="w-4 h-4 text-emerald-300" /> Ministry Verified Support
        </div>
        <h2 className="text-lg font-extrabold mt-1 leading-tight">On-Field Expert Assistance</h2>
        <p className="text-xs text-emerald-100 mt-1 font-medium leading-relaxed">
          Book on-site pond visits or speak directly with certified aquaculture specialists in your district.
        </p>
      </section>

      {/* Officers List */}
      <section className="mx-5 mt-5 space-y-3.5 mb-6">
        <h2 className="text-sm font-extrabold text-gray-900">Certified Extension Officers ({certifiedOfficers.length})</h2>

        {certifiedOfficers.map((officer) => (
          <div key={officer.id} className="emerald-card p-4.5 rounded-3xl space-y-3 shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={farmerImg} alt={officer.name} className="w-11 h-11 rounded-2xl object-cover border-2 border-[#0F6236]" />
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                    {officer.name}
                    {officer.verified && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
                    )}
                  </h3>
                  <div className="text-[11px] font-bold text-[#0F6236] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {officer.region}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {officer.rating}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs space-y-1 text-gray-800">
              <div className="font-bold text-gray-900">Specialty: <span className="text-gray-600 font-medium">{officer.specialty}</span></div>
              <div className="font-bold text-gray-900">Availability: <span className="text-gray-600 font-medium">{officer.availableDays}</span></div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${officer.phone.replace(/\s+/g, "")}`}
                className="flex-1 h-11 rounded-2xl bg-[#0F6236] hover:bg-[#0B4D29] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <PhoneCall className="w-4 h-4" /> Call {officer.name}
              </a>
              <a
                href={`https://wa.me/233${officer.phone.replace(/[^0-9]/g, "").replace(/^233/, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hello ${officer.name}! I need support for my fish farm from FishDoctor AI.`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        ))}
      </section>

      <BottomNav />
    </PhoneFrame>
  );
}
